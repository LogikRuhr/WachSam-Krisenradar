import pytest
from src.adapters.destatis import DestatisAdapter
from src.adapters.bnetza import BNetzAAdapter
from src.adapters.fao import FAOAdapter
from src.adapters.eurostat import EurostatAdapter
from src.adapters.warning_indicators import WarningIndicatorsAdapter


def _validate_items(items):
    """Gemeinsame Validierung für alle Adapter-Items."""
    assert isinstance(items, list)
    assert len(items) >= 1
    for item in items:
        assert item.title
        assert item.source_url.startswith("https://")
        assert item.germany_relevance is not None
        assert item.germany_relevance.direct in (True, False)
        assert len(item.affected_systems) >= 1
        assert item.methodology_tag in ("steep", "rca", "bia", "fmea", "scenario")
        assert item.severity_suggestion in ("stabil", "beobachten", "erhöht", "kritisch", "eskalierend")
        assert item.confidence_suggestion in ("niedrig", "mittel", "hoch")


def test_destatis_adapter():
    adapter = DestatisAdapter()
    assert adapter.name == "Destatis"
    assert adapter.source_class == "behoerde"
    items = adapter.fetch_latest()
    _validate_items(items)
    assert any("destatis.de" in i.source_url for i in items)


def test_bnetza_adapter():
    adapter = BNetzAAdapter()
    assert adapter.name == "BNetzA"
    items = adapter.fetch_latest()
    _validate_items(items)
    assert any("energie" in i.affected_systems for i in items)


def test_fao_adapter():
    adapter = FAOAdapter()
    assert adapter.name == "FAO"
    items = adapter.fetch_latest()
    _validate_items(items)


def test_eurostat_adapter():
    adapter = EurostatAdapter()
    assert adapter.name == "Eurostat"
    items = adapter.fetch_latest()
    _validate_items(items)


def test_warning_indicators_adapter():
    adapter = WarningIndicatorsAdapter()
    assert adapter.name == "WarningIndicators"
    items = adapter.fetch_latest()
    assert isinstance(items, list)
