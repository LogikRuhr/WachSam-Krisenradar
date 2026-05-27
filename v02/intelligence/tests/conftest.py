import pytest
from datetime import datetime
from src.models import IngestionItem, GermanyRelevance


@pytest.fixture
def sample_item():
    return IngestionItem(
        title="Test Item",
        description="Test Beschreibung",
        source_url="https://example.com",
        source_class="behoerde",
        last_ingested_at=datetime.utcnow(),
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["energie"],
            time_to_impact="wochen",
            description="Test",
        ),
        methodology_tag="steep",
        affected_systems=["energie"],
    )
