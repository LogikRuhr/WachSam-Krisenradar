"""W6a.1 — C4-Quellfehler-Sichtbarkeit. Rein gemockt, kein Netz/DB.

Deckt zwei Ebenen ab:
- BaseAdapter.record_source_error sammelt strukturierte Quellfehler.
- Die Indikator-Adapter melden im Fehlerzweig genau einen Quellfehler pro
  betroffenem Indikator, OHNE den produktiven Fallback-/Item-Pfad zu ändern.
"""
from typing import List
from unittest.mock import MagicMock

import pytest

from src.adapters.base import BaseAdapter
from src.models import IngestionItem


class _DummyAdapter(BaseAdapter):
    def __init__(self):
        super().__init__("Dummy")

    def fetch_latest(self) -> List[IngestionItem]:
        return []


# --- BaseAdapter.record_source_error -----------------------------------------

def test_new_adapter_starts_with_empty_source_errors():
    adapter = _DummyAdapter()
    assert adapter.source_errors == []


def test_record_source_error_appends_structured_entry():
    adapter = _DummyAdapter()
    adapter.record_source_error(
        "wi-oel-brent", "HTTP 401", source_url="https://example.org/", observed_at="2026-06-04"
    )
    assert len(adapter.source_errors) == 1
    err = adapter.source_errors[0]
    assert err["indicator_id"] == "wi-oel-brent"
    assert err["reason"] == "HTTP 401"
    assert err["source_url"] == "https://example.org/"
    assert err["observed_at"] == "2026-06-04"


def test_source_errors_are_per_instance():
    a, b = _DummyAdapter(), _DummyAdapter()
    a.record_source_error("wi-oel-brent", "HTTP 500")
    assert a.source_errors and b.source_errors == []


# --- Adapter-Verdrahtung (gemockt, kein Netz) --------------------------------

class _FakeResp:
    def __init__(self, status_code=200, text="", json_data=None):
        self.status_code = status_code
        self.text = text
        self._json = json_data or {}

    def json(self):
        return self._json

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


def test_destatis_records_source_error_on_http_error(monkeypatch):
    from src.adapters import destatis
    monkeypatch.setattr(destatis.requests, "post", lambda *a, **k: _FakeResp(status_code=401))
    adapter = destatis.DestatisAdapter()

    items = adapter.fetch_latest()

    # Produktiver Fallback unverändert: ein Item OHNE indicator_id.
    assert len(items) == 1
    assert items[0].indicator_id is None
    # Genau ein Quellfehler für den bekannten Indikator.
    assert len(adapter.source_errors) == 1
    err = adapter.source_errors[0]
    assert err["indicator_id"] == "wi-inflation-vpi-de"
    assert "401" in err["reason"]


def test_fred_records_source_error_on_http_error(monkeypatch):
    from src.adapters import fred
    # Gültiger Key gesetzt: Test prüft bewusst den HTTP-Fehlerpfad, nicht den Key-Guard.
    monkeypatch.setattr(fred.settings, "FRED_API_KEY", "test-key")
    monkeypatch.setattr(fred.requests, "get", lambda *a, **k: _FakeResp(status_code=400))
    adapter = fred.FREDAdapter()

    items = adapter.fetch_latest()

    assert len(items) == 1
    assert items[0].indicator_id is None
    assert len(adapter.source_errors) == 1
    assert adapter.source_errors[0]["indicator_id"] == "wi-gaspreis-europa"
    assert "400" in adapter.source_errors[0]["reason"]


def test_fred_guards_missing_api_key(monkeypatch):
    """Ohne FRED_API_KEY wird kein Request gemacht; stattdessen Quellfehler + Fallback."""
    from src.adapters import fred
    monkeypatch.setattr(fred.settings, "FRED_API_KEY", "")

    def boom(*a, **k):
        raise AssertionError("requests.get darf ohne FRED_API_KEY nicht aufgerufen werden")

    monkeypatch.setattr(fred.requests, "get", boom)
    adapter = fred.FREDAdapter()

    items = adapter.fetch_latest()

    # Produktiver Fallback unverändert: ein Item OHNE indicator_id.
    assert len(items) == 1
    assert items[0].indicator_id is None
    # Genau ein Quellfehler, klassifiziert als fehlender Key.
    assert len(adapter.source_errors) == 1
    err = adapter.source_errors[0]
    assert err["indicator_id"] == "wi-gaspreis-europa"
    assert "api_key" in err["reason"].lower()


def test_eia_records_source_error_on_http_error(monkeypatch):
    from src.adapters import eia
    # Gültiger Key gesetzt: Test prüft bewusst den HTTP-Fehlerpfad, nicht den Key-Guard.
    monkeypatch.setattr(eia.settings, "EIA_API_KEY", "test-key")
    monkeypatch.setattr(eia.requests, "get", lambda *a, **k: _FakeResp(status_code=403))
    adapter = eia.EIAAdapter()

    items = adapter.fetch_latest()

    assert len(items) == 1
    assert items[0].indicator_id is None
    assert len(adapter.source_errors) == 1
    assert adapter.source_errors[0]["indicator_id"] == "wi-oel-brent"
    assert "403" in adapter.source_errors[0]["reason"]


def test_eia_guards_missing_api_key(monkeypatch):
    """Ohne EIA_API_KEY wird kein Request gemacht; stattdessen Quellfehler + Fallback."""
    from src.adapters import eia
    monkeypatch.setattr(eia.settings, "EIA_API_KEY", "")

    def boom(*a, **k):
        raise AssertionError("requests.get darf ohne EIA_API_KEY nicht aufgerufen werden")

    monkeypatch.setattr(eia.requests, "get", boom)
    adapter = eia.EIAAdapter()

    items = adapter.fetch_latest()

    # Produktiver Fallback unverändert: ein Item OHNE indicator_id.
    assert len(items) == 1
    assert items[0].indicator_id is None
    # Genau ein Quellfehler, klassifiziert als fehlender Key.
    assert len(adapter.source_errors) == 1
    err = adapter.source_errors[0]
    assert err["indicator_id"] == "wi-oel-brent"
    assert "api_key" in err["reason"].lower()


def test_fao_records_source_error_on_fetch_failure(monkeypatch):
    from src.adapters import fao

    def boom(*a, **k):
        raise RuntimeError("connection refused")

    monkeypatch.setattr(fao.requests, "get", boom)
    adapter = fao.FAOAdapter()

    items = adapter.fetch_latest()

    # Produktiver Fallback unverändert: ein Item OHNE indicator_id.
    assert len(items) == 1
    assert items[0].indicator_id is None
    assert len(adapter.source_errors) == 1
    assert adapter.source_errors[0]["indicator_id"] == "wi-fao-food-price-index"


def test_tankerkoenig_records_both_fuels_without_api_key(monkeypatch):
    from src.adapters import tankerkoenig
    monkeypatch.setattr(tankerkoenig.settings, "TANKERKOENIG_API_KEY", "")
    adapter = tankerkoenig.TankerkoenigAdapter()

    items = adapter.fetch_latest()

    # Produktiv unverändert: ohne Key kein Item.
    assert items == []
    ids = {e["indicator_id"] for e in adapter.source_errors}
    assert ids == {
        "wi-kraftstoffpreis-super-e5",
        "wi-kraftstoffpreis-super-e10",
        "wi-kraftstoffpreis-diesel",
    }
