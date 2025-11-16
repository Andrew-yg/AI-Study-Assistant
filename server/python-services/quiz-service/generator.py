from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

import aiohttp
from openai import AsyncOpenAI

from shared.config import settings

QUESTION_TYPE_LABELS = {
    "multiple_choice": "multiple-choice",
    "true_false": "true/false",
    "short_answer": "short answer",
}

DIFFICULTY_TONES = {
    "easy": "friendly and confidence-building",
    "medium": "balanced and skills-focused",
    "hard": "rigorous and exam-ready",
}


class QuizGenerator:
    """Generate practice quizzes and evaluate answers via OpenAI"""

    def __init__(self) -> None:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required for quiz generation")
        self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_questions(
        self,
        *,
        material_ids: List[str],
        user_id: str,
        question_type: str,
        difficulty: str,
        count: int,
    ) -> Dict[str, Any]:
        if not material_ids:
            raise ValueError("material_ids is required for quiz generation")

        context = await self._fetch_material_context(material_ids=material_ids, user_id=user_id)
        sources = context.get("sources", [])
        if not sources:
            raise ValueError("无法从学习资料中检索到内容，请先上传并处理 PDF 文件。")

        summary_text = context.get("answer") or context.get("summary") or ""
        context_block = self._format_sources(sources)

        prompt = self._build_generation_prompt(
            context_summary=summary_text,
            context_block=context_block,
            question_type=question_type,
            difficulty=difficulty,
            count=count,
        )

        completion = await self._client.chat.completions.create(
            model=settings.OPENAI_COMPLETION_MODEL,
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert teaching assistant who writes tightly scoped "
                        "practice quizzes directly from the provided course material. "
                        "Always return valid JSON and keep questions grounded in the context."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        )

        raw_json = completion.choices[0].message.content or ""
        try:
            parsed = json.loads(raw_json)
        except json.JSONDecodeError as err:
            raise ValueError(f"Quiz generation returned invalid JSON: {err}")

        questions = self._normalize_questions(parsed.get("questions", []), question_type, difficulty)
        if not questions:
            raise ValueError("Quiz generation did not return any valid questions")

        return {
            "questions": questions,
            "material_summary": summary_text,
        }

    async def evaluate_answer(
        self,
        *,
        question: str,
        correct_answer: str,
        user_answer: str,
        question_type: str,
        explanation: Optional[str] = None,
        context_summary: Optional[str] = None,
    ) -> Dict[str, Any]:
        normalized_user = self._normalize_answer(user_answer)
        normalized_correct = self._normalize_answer(correct_answer)

        if question_type in {"multiple_choice", "true_false"}:
            is_correct = normalized_user == normalized_correct
            score = 1.0 if is_correct else 0.0
            feedback = "Nice work!" if is_correct else f"Not quite. Correct answer: {correct_answer}."
            if not is_correct:
                feedback = await self._ensure_feedback(
                    base_feedback=feedback,
                    question=question,
                    correct_answer=correct_answer,
                    existing_explanation=explanation,
                    context_summary=context_summary,
                )
            return {
                "is_correct": is_correct,
                "score": score,
                "feedback": feedback,
            }

        evaluation_prompt = self._build_evaluation_prompt(
            question=question,
            correct_answer=correct_answer,
            user_answer=user_answer,
            explanation=explanation,
            context_summary=context_summary,
        )

        completion = await self._client.chat.completions.create(
            model=settings.OPENAI_COMPLETION_MODEL,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You grade short-answer responses using the rubric. "
                        "Return JSON with is_correct (bool), score (0-1), and feedback."
                    ),
                },
                {"role": "user", "content": evaluation_prompt},
            ],
        )

        raw_json = completion.choices[0].message.content or ""
        try:
            parsed = json.loads(raw_json)
        except json.JSONDecodeError as err:
            raise ValueError(f"Evaluation returned invalid JSON: {err}")

        is_correct = bool(parsed.get("is_correct"))
        score = float(parsed.get("score", 0))
        feedback = str(parsed.get("feedback") or "")
        feedback = await self._ensure_feedback(
            base_feedback=feedback,
            question=question,
            correct_answer=correct_answer,
            existing_explanation=explanation,
            context_summary=context_summary,
        )

        return {
            "is_correct": is_correct,
            "score": max(0.0, min(score, 1.0)),
            "feedback": feedback or ("Great job!" if is_correct else "Review the reference material."),
        }

    async def _ensure_feedback(
        self,
        *,
        base_feedback: str,
        question: str,
        correct_answer: str,
        existing_explanation: Optional[str],
        context_summary: Optional[str],
    ) -> str:
        feedback = (base_feedback or "").strip()
        detail = (existing_explanation or "").strip()

        if detail and detail.lower() != correct_answer.strip().lower():
            enriched = f"Explanation: {detail}"
            return f"{feedback}\n{enriched}" if feedback else enriched

        generated = await self._generate_explanation(
            question=question,
            correct_answer=correct_answer,
            context_summary=context_summary,
        )

        if not feedback:
            return generated
        return f"{feedback}\n{generated}"

    async def _generate_explanation(
        self,
        *,
        question: str,
        correct_answer: str,
        context_summary: Optional[str],
    ) -> str:
        prompt = (
            "你是一名数据库和计算机系统教学助教，需要用 2-3 句话解释为什么正确答案成立。"
            "保持语气友好，并引用上下文中的关键词。\n\n"
            f"题目：{question}\n"
            f"正确答案：{correct_answer}\n"
            f"补充上下文：{context_summary or '（未提供）'}\n"
            "请直接输出解释文本，不要重复题目。"
        )

        completion = await self._client.chat.completions.create(
            model=settings.OPENAI_COMPLETION_MODEL,
            temperature=0.2,
            messages=[
                {"role": "system", "content": "You write concise teaching explanations in Chinese."},
                {"role": "user", "content": prompt},
            ],
        )

        explanation_text = completion.choices[0].message.content or ""
        explanation_text = explanation_text.strip()
        if not explanation_text:
            return "Explanation unavailable. Review the study notes."
        return explanation_text

    async def _fetch_material_context(self, *, material_ids: List[str], user_id: str) -> Dict[str, Any]:
        if not settings.RAG_SERVICE_URL:
            return {}

        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            context = await self._rag_query(session, material_ids=material_ids, user_id=user_id, top_k=8)
            sources = context.get("sources") or []
            summary_text = context.get("answer") or ""

            print(f"[Quiz Generator Debug] Initial RAG query for materials={material_ids}, user={user_id}")
            print(f"[Quiz Generator Debug] Initial sources count: {len(sources)}")
            print(f"[Quiz Generator Debug] Summary length: {len(summary_text)}")

            if not sources:
                fallback_sources: List[Dict[str, Any]] = []
                summary_parts: List[str] = [summary_text] if summary_text else []

                for material_id in material_ids:
                    extra = await self._rag_query(session, material_ids=[material_id], user_id=user_id, top_k=6)
                    print(f"[Quiz Generator Debug] Fallback query for material={material_id}: {len(extra.get('sources', []))} sources")
                    if extra.get("sources"):
                        fallback_sources.extend(extra["sources"])
                    if extra.get("answer"):
                        summary_parts.append(extra["answer"])
                    if len(fallback_sources) >= 8:
                        break

                if fallback_sources:
                    context["sources"] = fallback_sources[:8]
                if not summary_text and summary_parts:
                    context["answer"] = " \n".join(part.strip() for part in summary_parts if part.strip())

            if not context.get("sources"):
                print(f"[Quiz Generator Debug] FATAL: No sources found after fallback!")
                print(f"[Quiz Generator Debug] This means MongoDB Atlas Vector Search Index is missing.")
                print(f"[Quiz Generator Debug] Run: python3 diagnose_rag_pipeline.py")
                print(f"[Quiz Generator Debug] See: ATLAS_VECTOR_SEARCH_SETUP.md")
                raise ValueError(
                    "无法从学习资料中检索到内容。"
                    "可能原因：MongoDB Atlas Vector Search Index 未创建或未激活。"
                    "请查看 ATLAS_VECTOR_SEARCH_SETUP.md 文件了解如何创建索引。"
                )

            return context

    async def _rag_query(
        self,
        session: aiohttp.ClientSession,
        *,
        material_ids: List[str],
        user_id: str,
        top_k: int,
    ) -> Dict[str, Any]:
        payload = {
            "question": "Summarize the most important concepts for quiz generation.",
            "material_ids": material_ids,
            "user_id": user_id,
            "top_k": top_k,
        }

        async with session.post(f"{settings.RAG_SERVICE_URL}/query", json=payload) as resp:
            if resp.status >= 400:
                text = await resp.text()
                raise RuntimeError(f"Failed to fetch material context ({resp.status}): {text}")
            return await resp.json()

    def _build_generation_prompt(
        self,
        *,
        context_summary: str,
        context_block: str,
        question_type: str,
        difficulty: str,
        count: int,
    ) -> str:
        tone = DIFFICULTY_TONES.get(difficulty, "balanced")
        label = QUESTION_TYPE_LABELS.get(question_type, question_type)
        return (
            "You are provided with study notes extracted directly from user-uploaded PDFs. "
            "Ground every question strictly in this content and do not invent outside facts.\n\n"
            f"Study summary:\n{context_summary or '(Summary unavailable — rely on the detailed excerpts below.)'}\n\n"
            f"Detailed excerpts (reference the [n] labels in your reasoning):\n{context_block}\n\n"
            f"Create {count} {label} questions at a {difficulty} difficulty while using a {tone} tone. Each JSON question must include:\n"
            "- question (string)\n"
            "- question_type (must equal the requested type)\n"
            "- options (array of 4 concise options) when question_type is multiple_choice; omit for others\n"
            "- correct_answer (string)\n"
            "- explanation (1-2 sentences that reference the excerpts)\n"
            "- difficulty (easy/medium/hard)\n"
            "- tags (array of keywords)\n"
            "- source_summary (cite which excerpt(s) informed the answer, e.g., '[2] energy bands in Figure 3')\n"
            "Return valid JSON shaped as {\"questions\": [ ... ]} and never include plain text."
        )

    def _build_evaluation_prompt(
        self,
        *,
        question: str,
        correct_answer: str,
        user_answer: str,
        explanation: Optional[str],
        context_summary: Optional[str],
    ) -> str:
        return (
            f"Question: {question}\n"
            f"Correct answer: {correct_answer}\n"
            f"Student answer: {user_answer}\n"
            f"Reference explanation: {explanation or 'N/A'}\n"
            f"Context: {context_summary or 'Not provided'}\n\n"
            "Assess if the student captured the key idea."
        )

    def _normalize_questions(
        self,
        raw_questions: List[Dict[str, Any]],
        question_type: str,
        fallback_difficulty: str,
    ) -> List[Dict[str, Any]]:
        normalized: List[Dict[str, Any]] = []
        for entry in raw_questions:
            question_text = (entry.get("question") or entry.get("prompt") or "").strip()
            correct_answer = (entry.get("correct_answer") or entry.get("answer") or "").strip()
            if not question_text or not correct_answer:
                continue

            options = entry.get("options") or entry.get("choices")
            if question_type == "multiple_choice":
                if not isinstance(options, list) or len(options) < 2:
                    continue
                options = [str(opt).strip() for opt in options if str(opt).strip()]

            normalized.append(
                {
                    "question": question_text,
                    "question_type": question_type,
                    "options": options if question_type == "multiple_choice" else None,
                    "correct_answer": correct_answer,
                    "explanation": (entry.get("explanation") or entry.get("rationale") or "").strip(),
                    "difficulty": (entry.get("difficulty") or fallback_difficulty).lower(),
                    "tags": entry.get("tags") if isinstance(entry.get("tags"), list) else [],
                    "source_summary": entry.get("source_summary"),
                }
            )
        return normalized

    def _format_sources(self, sources: List[Dict[str, Any]]) -> str:
        if not sources:
            return "(no additional sources)"
        lines = []
        for idx, source in enumerate(sources[:5], start=1):
            meta = source.get("metadata", {})
            filename = meta.get("filename") or meta.get("material_id") or "material"
            snippet = (source.get("snippet") or "").strip().replace("\n", " ")
            lines.append(f"[{idx}] {filename}: {snippet[:500]}")
        return "\n".join(lines)

    def _normalize_answer(self, value: str) -> str:
        return (value or "").strip().lower()


def create_quiz_generator() -> QuizGenerator:
    return QuizGenerator()
