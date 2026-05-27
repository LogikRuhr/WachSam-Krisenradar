import asyncio
from datetime import datetime

from src import main
from src.models import GermanyRelevance, IngestionItem


class EmptyAdapter:
    name = "Empty"

    def fetch_latest(self):
        return []


class EmptyCrawler:
    def fetch_all(self):
        return []


def test_run_ingestion_routes_bnetza_indicator_items_to_indicator_updates(monkeypatch):
    bnetza_item = IngestionItem(
        title="Gasspeicher Deutschland: 72.5% (2026-05-27)",
        description="Aktueller Fuellstand deutscher Gasspeicher: 72.5%.",
        source_url="https://agsi.gie.eu/",
        source_class="behoerde",
        last_ingested_at=datetime.utcnow(),
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["energie", "industrie"],
            time_to_impact="kurzfristig",
            description="Gasspeicher-Fuellstand ist relevant fuer Energieversorgung.",
        ),
        methodology_tag="scenario",
        affected_systems=["energie", "industrie"],
        indicator_id="wi-gasspeicher-fuellstand",
        current_value=72.5,
        current_value_date="2026-05-27",
        previous_value=71.9,
        previous_value_date="2026-05-26",
    )

    class FakeBNetzAAdapter:
        name = "BNetzA"

        def fetch_latest(self):
            return [bnetza_item]

    monkeypatch.setattr(main, "DestatisAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "BNetzAAdapter", FakeBNetzAAdapter)
    monkeypatch.setattr(main, "EIAAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "FAOAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "EurostatAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "WarningIndicatorsAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "RSSCrawler", EmptyCrawler)

    inserted = []

    def fake_insert_draft(item, item_type):
        inserted.append((item, item_type))
        return item.indicator_id or "draft-id"

    monkeypatch.setattr(main, "insert_draft", fake_insert_draft)

    asyncio.run(main.run_ingestion())

    assert inserted == [(bnetza_item, "indicators")]
