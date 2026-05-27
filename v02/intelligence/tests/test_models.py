import pytest
from datetime import datetime
from pydantic import ValidationError
from src.models import IngestionItem, GermanyRelevance


def test_germany_relevance_valid():
    gr = GermanyRelevance(
        direct=True,
        systems_affected=["energie", "lebensmittel"],
        time_to_impact="wochen",
        description="Test",
    )
    assert gr.direct is True
    assert len(gr.systems_affected) == 2


def test_germany_relevance_missing_field():
    with pytest.raises(ValidationError):
        GermanyRelevance(direct=True, systems_affected=["energie"])


def test_ingestion_item_defaults(sample_item):
    assert sample_item.status == "raw"
    assert sample_item.severity_suggestion == "beobachten"
    assert sample_item.confidence_suggestion == "mittel"
    assert sample_item.editorial_reviewed_at is None
    assert sample_item.published_at is None


def test_ingestion_item_requires_germany_relevance():
    with pytest.raises(ValidationError):
        IngestionItem(
            title="Test",
            description="Test",
            source_url="https://example.com",
            source_class="behoerde",
            last_ingested_at=datetime.utcnow(),
            methodology_tag="steep",
            affected_systems=["energie"],
        )


def test_ingestion_item_valid_severity():
    item = IngestionItem(
        title="Test",
        description="Test",
        source_url="https://example.com",
        source_class="behoerde",
        last_ingested_at=datetime.utcnow(),
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["energie"],
            time_to_impact="kurzfristig",
            description="Test",
        ),
        methodology_tag="rca",
        affected_systems=["energie"],
        severity_suggestion="kritisch",
        confidence_suggestion="hoch",
    )
    assert item.severity_suggestion == "kritisch"
    assert item.confidence_suggestion == "hoch"
