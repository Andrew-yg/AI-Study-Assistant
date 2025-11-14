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
        summary_text = context.get("answer") or context.get("summary") or ""
        sources_excerpt = self._format_sources(context.get("sources", []))

        prompt = self._build_generation_prompt(
            context_summary=summary_text,
            sources_excerpt=sources_excerpt,
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

        return {
            "is_correct": is_correct,
            "score": max(0.0, min(score, 1.0)),
            "feedback": feedback or ("Great job!" if is_correct else "Review the reference material."),
        }

    async def _fetch_material_context(self, *, material_ids: List[str], user_id: str) -> Dict[str, Any]:
        if not settings.RAG_SERVICE_URL:
            return {}

        payload = {
            "question": "Summarize the most important concepts for quiz generation.",
            "material_ids": material_ids,
            "user_id": user_id,
            "top_k": 8,
        }

        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(f"{settings.RAG_SERVICE_URL}/query", json=payload) as resp:
                if resp.status >= 400:
                    text = await resp.text()
                    raise RuntimeError(f"Failed to fetch material context ({resp.status}): {text}")
                return await resp.json()

    def _build_generation_prompt(
        self,
        *,
        context_summary: str,
        sources_excerpt: str,
        question_type: str,
        difficulty: str,
        count: int,
    ) -> str:
        tone = DIFFICULTY_TONES.get(difficulty, "balanced")
        label = QUESTION_TYPE_LABELS.get(question_type, question_type)
        return (
            f"Context summary:\n{context_summary}\n\n"
            f"Sources:\n{sources_excerpt}\n\n"
            f"Create {count} {label} questions at a {difficulty} difficulty."\
            f"Use a {tone} tone. Each question must include:\n"
            "- question (string)\n"
            "- question_type (must match input)\n"
            "- options (array of 4 concise options) for multiple-choice, otherwise omit\n"
            "- correct_answer (string)\n"
            "- explanation (1-2 sentences)\n"
            "- difficulty (easy/medium/hard)\n"
            "- tags (array of keywords)\n"
            "Return JSON: {\"questions\": [ ... ]}."
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
        for idx, source in enumerate(sources[:3], start=1):
            meta = source.get("metadata", {})
            filename = meta.get("filename") or meta.get("material_id") or "material"
            snippet = (source.get("snippet") or "").strip().replace("\n", " ")
            lines.append(f"[{idx}] {filename}: {snippet[:280]}")
        return "\n".join(lines)

    def _normalize_answer(self, value: str) -> str:
        return (value or "").strip().lower()


def create_quiz_generator() -> QuizGenerator:
    return QuizGenerator()
