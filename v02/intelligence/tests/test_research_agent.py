from datetime import datetime

import pytest

from src.models import GermanyRelevance, IngestionItem
from src.research_agent.agent import extract_with_research_agent
from src.research_agent.tools import assess_evidence_quality


def _item(status="extracted"):
    return IngestionItem(
        title="Belastbares Signal",
        description="Ein belegtes Signal mit Deutschland-Relevanz.",
        source_url="https://example.com/article",
        source_class="qualitaetsmedien",
        last_ingested_at=datetime.utcnow(),
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["industrie"],
            time_to_impact="wochen",
            description="Industrie und Arbeit koennen betroffen sein.",
        ),
        methodology_tag="steep",
        affected_systems=["industrie"],
        severity_suggestion="beobachten",
        confidence_suggestion="mittel",
        status=status,
    )


def test_assess_evidence_quality_rejects_navigation_text():
    text = "Navigation Suche Startseite Inland Wirtschaft Wetter Video Footer " * 30

    result = assess_evidence_quality(text, min_chars=200)

    assert result.quality == "low"
    assert result.rejection_reason == "navigation_or_layout_text"
    assert result.source_claims == []


@pytest.mark.asyncio
async def test_research_agent_rejects_low_quality_evidence_without_llm_call():
    calls = []

    async def fake_extractor(*args):
        calls.append(args)
        return _item()

    result = await extract_with_research_agent(
        "Navigation Suche Startseite Footer",
        "https://example.com/navigation",
        "qualitaetsmedien",
        llm_extractor=fake_extractor,
        min_evidence_chars=200,
    )

    assert result.item is None
    assert result.evidence_quality == "low"
    assert result.rejection_reason == "evidence_too_short"
    assert calls == []


@pytest.mark.asyncio
async def test_research_agent_returns_draft_for_sufficient_evidence():
    text = (
        "Der Konzern meldet steigende Kosten in der Lieferkette und kuendigt weitere Pruefungen an. "
        "Analysten verweisen auf moegliche Auswirkungen fuer Zulieferer und Beschaeftigung in Deutschland. "
        "Die Entwicklung betrifft besonders energieintensive Produktion und industrielle Planung. "
        "Haushalte koennten indirekt ueber Arbeitsmarkt und regionale Kaufkraft betroffen sein."
    )

    async def fake_extractor(content, source_url, source_class):
        assert content == text
        assert source_url == "https://example.com/article"
        assert source_class == "qualitaetsmedien"
        return _item()

    result = await extract_with_research_agent(
        text,
        "https://example.com/article",
        "qualitaetsmedien",
        llm_extractor=fake_extractor,
        min_evidence_chars=120,
    )

    assert result.item is not None
    assert result.item.status == "extracted"
    assert result.evidence_quality in {"medium", "high"}
    assert len(result.source_claims) >= 2


@pytest.mark.asyncio
async def test_research_agent_never_allows_published_status_from_extractor():
    text = (
        "Die Quelle beschreibt mehrere belegte Aussagen zu Industrie, Lieferketten und Deutschland. "
        "Sie nennt konkrete wirtschaftliche Belastungen und moegliche Folgen fuer Unternehmen. "
        "Daraus koennen indirekte Haushaltswirkungen entstehen, insbesondere ueber Arbeit und Preise."
    )

    async def fake_extractor(*_args):
        return _item(status="published")

    result = await extract_with_research_agent(
        text,
        "https://example.com/article",
        "qualitaetsmedien",
        llm_extractor=fake_extractor,
        min_evidence_chars=120,
    )

    assert result.item is not None
    assert result.item.status == "extracted"
    assert result.item.published_at is None
    assert result.item.editorial_reviewed_at is None
