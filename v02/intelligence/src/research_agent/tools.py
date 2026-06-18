from __future__ import annotations

import re
from dataclasses import dataclass


NAVIGATION_MARKERS = (
    "navigation",
    "suche",
    "startseite",
    "footer",
    "video",
    "wetter",
    "newsletter",
    "breadcrumb",
)


@dataclass(frozen=True)
class EvidenceAssessment:
    quality: str
    rejection_reason: str | None
    source_claims: list[str]


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def extract_source_claims(text: str, limit: int = 5) -> list[str]:
    """Return compact source-grounded claim candidates from article evidence."""
    normalized = _normalize(text)
    sentences = re.split(r"(?<=[.!?])\s+", normalized)
    claims = []
    for sentence in sentences:
        cleaned = sentence.strip()
        if len(cleaned) < 40:
            continue
        lower = cleaned.lower()
        if sum(1 for marker in NAVIGATION_MARKERS if marker in lower) >= 2:
            continue
        claims.append(cleaned)
        if len(claims) >= limit:
            break
    return claims


def assess_evidence_quality(raw_content: str, min_chars: int = 600) -> EvidenceAssessment:
    """Gate RSS article evidence before any LLM/agent draft attempt."""
    normalized = _normalize(raw_content)
    if len(normalized) < min_chars:
        return EvidenceAssessment("low", "evidence_too_short", [])

    lower = normalized.lower()
    navigation_hits = sum(1 for marker in NAVIGATION_MARKERS if marker in lower)
    if navigation_hits >= 4:
        return EvidenceAssessment("low", "navigation_or_layout_text", [])

    claims = extract_source_claims(normalized)
    if len(claims) < 2:
        return EvidenceAssessment("low", "insufficient_source_claims", claims)

    quality = "high" if len(normalized) >= min_chars * 2 and len(claims) >= 3 else "medium"
    return EvidenceAssessment(quality, None, claims)


def assess_evidence_tool(raw_content: str) -> dict:
    """ADK-compatible tool wrapper for assessing article evidence quality."""
    result = assess_evidence_quality(raw_content)
    return {
        "quality": result.quality,
        "rejection_reason": result.rejection_reason,
        "source_claims": result.source_claims,
    }

