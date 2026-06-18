from __future__ import annotations

from dataclasses import dataclass
from typing import Awaitable, Callable

from ..config import settings
from ..models import IngestionItem
from ..extractors.llm_extractor import extract_with_llm
from .tools import assess_evidence_quality, assess_evidence_tool


LlmExtractor = Callable[[str, str, str], Awaitable[IngestionItem | None]]


@dataclass(frozen=True)
class ResearchAgentResult:
    item: IngestionItem | None
    evidence_quality: str
    rejection_reason: str | None
    source_claims: list[str]


async def extract_with_research_agent(
    raw_content: str,
    source_url: str,
    source_class: str,
    *,
    llm_extractor: LlmExtractor = extract_with_llm,
    min_evidence_chars: int | None = None,
) -> ResearchAgentResult:
    """Create a draft candidate only when article evidence is usable."""
    threshold = min_evidence_chars or settings.WACHSAM_RESEARCH_AGENT_MIN_EVIDENCE_CHARS
    assessment = assess_evidence_quality(raw_content, min_chars=threshold)
    if assessment.quality == "low":
        return ResearchAgentResult(
            item=None,
            evidence_quality=assessment.quality,
            rejection_reason=assessment.rejection_reason,
            source_claims=assessment.source_claims,
        )

    item = await llm_extractor(raw_content, source_url, source_class)
    if item is None:
        return ResearchAgentResult(
            item=None,
            evidence_quality=assessment.quality,
            rejection_reason="llm_extraction_failed",
            source_claims=assessment.source_claims,
        )

    item.status = "extracted"
    item.published_at = None
    item.editorial_reviewed_at = None
    return ResearchAgentResult(
        item=item,
        evidence_quality=assessment.quality,
        rejection_reason=None,
        source_claims=assessment.source_claims,
    )


def _build_root_agent():
    try:
        from google.adk.agents import Agent
    except Exception:
        return None

    return Agent(
        model=settings.GEMINI_MODEL_ID,
        name="wachsam_research_agent",
        description="Assesses source evidence before WachSam draft extraction.",
        instruction=(
            "Assess only provided article evidence. Never publish. Return evidence "
            "quality, source claims, or a rejection reason."
        ),
        tools=[assess_evidence_tool],
    )


root_agent = _build_root_agent()

