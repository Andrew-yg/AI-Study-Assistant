from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import aiohttp
from openai import AsyncOpenAI

from shared.config import settings

SYSTEM_PROMPT = """
You are StudyBuddy, a friendly AI teaching assistant that helps students master their coursework.
You have access to two knowledge sources:
1. Course materials uploaded by the student (high trust, cite filename when used)
2. Optional live web search snippets (lower trust, cite the link)

Guidelines:
- Prefer course materials when they address the question.
- Use web results mainly for current events or when course materials are insufficient.
- Answer concisely with clear structure (bullets or short paragraphs) and actionable tips.
- Explicitly reference sources inline like [Material: filename] or [Web: site].
- If you cannot find a relevant answer, say so and suggest how the student could gather the info.
""".strip()

WEB_SEARCH_KEYWORDS = [
    "current",
    "latest",
    "today",
    "news",
    "update",
    "recent",
    "trend",
    "web",
    "internet",
    "online",
]


@dataclass
class ToolCall:
    name: str
    status: str
    detail: Optional[Dict[str, Any]] = None


class AgentOrchestrator:
    def __init__(self) -> None:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required for the agent service")

        self._llm = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_reply(
        self,
        *,
        message: str,
        user_id: str,
        history: Optional[List[Dict[str, str]]] = None,
        material_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        history = history or []
        material_ids = material_ids or []

        tool_calls: List[ToolCall] = []
        metadata: Dict[str, Any] = {
            "model": settings.OPENAI_COMPLETION_MODEL,
        }

        rag_result = None
        if material_ids and settings.RAG_SERVICE_URL:
            try:
                rag_result = await self._query_rag(
                    question=message,
                    user_id=user_id,
                    material_ids=material_ids,
                )
                metadata["rag_used"] = True
                metadata["rag_sources"] = rag_result.get("sources", [])
                tool_calls.append(
                    ToolCall(
                        name="rag_query",
                        status="success",
                        detail={
                            "materials": len(material_ids),
                            "sources": len(rag_result.get("sources", [])),
                        },
                    )
                )
            except Exception as err:
                tool_calls.append(
                    ToolCall(
                        name="rag_query",
                        status="error",
                        detail={"error": str(err)},
                    )
                )

        web_results = None
        if self._should_use_web_search(message, bool(material_ids)):
            try:
                web_results = await self._search_web(message)
                if web_results:
                    metadata["web_used"] = True
                    metadata["web_results"] = web_results
                    tool_calls.append(
                        ToolCall(
                            name="brave_search",
                            status="success",
                            detail={"results": len(web_results)},
                        )
                    )
            except Exception as err:
                tool_calls.append(
                    ToolCall(
                        name="brave_search",
                        status="error",
                        detail={"error": str(err)},
                    )
                )

        assistant_message = await self._call_llm(
            message=message,
            history=history,
            rag_result=rag_result,
            web_results=web_results,
        )

        return {
            "message": assistant_message,
            "tool_calls": [
                {
                    "name": call.name,
                    "status": call.status,
                    "detail": call.detail,
                }
                for call in tool_calls
            ],
            "metadata": metadata,
        }

    async def _query_rag(self, *, question: str, user_id: str, material_ids: List[str]) -> Dict[str, Any]:
        payload = {
            "question": question,
            "user_id": user_id,
            "material_ids": material_ids,
            "top_k": 5,
        }

        timeout = aiohttp.ClientTimeout(total=40)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(f"{settings.RAG_SERVICE_URL}/query", json=payload) as resp:
                if resp.status >= 400:
                    text = await resp.text()
                    raise RuntimeError(f"RAG query failed ({resp.status}): {text}")
                return await resp.json()

    async def _search_web(self, query: str) -> Optional[List[Dict[str, str]]]:
        if not settings.BRAVE_SEARCH_API_KEY:
            return None

        params = {
            "q": query,
            "count": 3,
            "extra_snippets": True,
        }
        headers = {
            "Accept": "application/json",
            "X-Subscription-Token": settings.BRAVE_SEARCH_API_KEY,
        }

        timeout = aiohttp.ClientTimeout(total=15)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get("https://api.search.brave.com/res/v1/web/search", params=params, headers=headers) as resp:
                if resp.status >= 400:
                    text = await resp.text()
                    raise RuntimeError(f"Brave search failed ({resp.status}): {text}")

                data = await resp.json()
                web_results = data.get("web", {}).get("results", [])
                formatted = []
                for item in web_results[:3]:
                    formatted.append(
                        {
                            "title": item.get("title"),
                            "url": item.get("url"),
                            "snippet": item.get("description") or item.get("snippet"),
                        }
                    )
                return formatted

    async def _call_llm(
        self,
        *,
        message: str,
        history: List[Dict[str, str]],
        rag_result: Optional[Dict[str, Any]],
        web_results: Optional[List[Dict[str, str]]],
    ) -> str:
        context_sections: List[str] = []

        if rag_result:
            sources_text = self._format_rag_sources(rag_result.get("sources", []))
            context_sections.append(f"Course materials summary:\n{rag_result.get('answer', '').strip()}\n\nSources:\n{sources_text}")

        if web_results:
            web_lines = []
            for idx, item in enumerate(web_results, start=1):
                web_lines.append(
                    f"[{idx}] {item.get('title')}\n{item.get('snippet')}\nLink: {item.get('url')}"
                )
            context_sections.append("Web search snippets:\n" + "\n\n".join(web_lines))

        messages: List[Dict[str, str]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ]

        if context_sections:
            messages.append({"role": "system", "content": "\n\n".join(context_sections)})

        messages.extend(history)
        messages.append({"role": "user", "content": message})

        response = await self._llm.chat.completions.create(
            model=settings.OPENAI_COMPLETION_MODEL,
            temperature=0.2,
            messages=messages,
        )

        content = response.choices[0].message.content if response.choices else None
        if not content:
            raise RuntimeError("LLM returned empty response")
        return content.strip()

    def _should_use_web_search(self, message: str, has_materials: bool) -> bool:
        if not settings.BRAVE_SEARCH_API_KEY:
            return False

        if not has_materials:
            return True

        lower_msg = message.lower()
        return any(keyword in lower_msg for keyword in WEB_SEARCH_KEYWORDS)

    def _format_rag_sources(self, sources: List[Dict[str, Any]]) -> str:
        if not sources:
            return "(no vector matches)"

        lines = []
        for idx, source in enumerate(sources[:3], start=1):
            metadata = source.get("metadata", {})
            filename = metadata.get("filename") or metadata.get("material_id")
            score = source.get("score")
            snippet = (source.get("snippet") or "").strip().replace("\n\n", "\n")
            if isinstance(score, (int, float)):
                score_display = f"{score:.2f}"
            else:
                score_display = "n/a"

            lines.append(
                f"[{idx}] {filename or 'Material'} (score: {score_display})\n{snippet[:400]}"
            )
        return "\n\n".join(lines)


def create_orchestrator() -> AgentOrchestrator:
    return AgentOrchestrator()
