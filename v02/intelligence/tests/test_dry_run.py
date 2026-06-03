"""Tests fuer den Dry-Run-Schutz (Welle 2, Schritt 1).

Sicherheitsziel: Im Dry-Run darf insert_draft NIEMALS eine echte DB-Verbindung
oeffnen oder schreiben. Adapter muessen sich ohne externen Call beschreiben.
"""
from datetime import datetime

import pytest

from src import db
from src.models import GermanyRelevance, IngestionItem
from src.adapters.eia import EIAAdapter
from src.adapters.bnetza import BNetzAAdapter
from src.adapters.tankerkoenig import TankerkoenigAdapter


@pytest.fixture(autouse=True)
def _reset_dry_run():
    """Stellt sicher, dass der globale Flag nach jedem Test zurueckgesetzt ist."""
    db.set_dry_run(False)
    yield
    db.set_dry_run(False)


def _indicator_item():
    return IngestionItem(
        title="Gasspeicher Deutschland: 72.5%",
        description="Fuellstand 72.5%",
        source_url="https://agsi.gie.eu/",
        source_class="behoerde",
        last_ingested_at=datetime.utcnow(),
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["energie"],
            time_to_impact="kurzfristig",
            description="Energieversorgung",
        ),
        methodology_tag="scenario",
        affected_systems=["energie"],
        indicator_id="wi-gasspeicher-fuellstand",
        current_value=72.5,
        current_value_date="2026-05-27",
    )


def test_default_is_not_dry_run():
    assert db.is_dry_run() is False


def test_insert_draft_dry_run_does_not_open_connection(monkeypatch, sample_item):
    """Kernschutz: get_connection darf im Dry-Run nicht aufgerufen werden."""
    def _boom():
        raise AssertionError("get_connection wurde im Dry-Run aufgerufen!")

    monkeypatch.setattr(db, "get_connection", _boom)
    db.set_dry_run(True)

    result = db.insert_draft(sample_item, "lagebild_items")

    # Liefert eine (Platzhalter-)ID, damit die saved-Zaehlung im Orchestrator funktioniert
    assert result is not None


def test_insert_draft_dry_run_indicator_returns_indicator_id(monkeypatch):
    monkeypatch.setattr(
        db, "get_connection", lambda: (_ for _ in ()).throw(AssertionError("kein DB-Zugriff erlaubt"))
    )
    db.set_dry_run(True)

    result = db.insert_draft(_indicator_item(), "indicators")

    assert result == "wi-gasspeicher-fuellstand"


def test_real_path_still_opens_connection(monkeypatch, sample_item):
    """Gegenprobe: ohne Dry-Run wird die (gemockte) Verbindung wie bisher genutzt."""
    called = {"n": 0}

    class _Cur:
        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def execute(self, *a, **k):
            pass

    class _Conn:
        def cursor(self):
            return _Cur()

        def commit(self):
            pass

        def rollback(self):
            pass

        def close(self):
            pass

    def _get_conn():
        called["n"] += 1
        return _Conn()

    monkeypatch.setattr(db, "get_connection", _get_conn)
    db.insert_draft(sample_item, "lagebild_items")

    assert called["n"] == 1


def test_adapter_describe_has_required_fields():
    desc = EIAAdapter().describe()
    for key in ("name", "source_class", "source", "requires_api_key", "writes_db", "output_target"):
        assert key in desc
    assert desc["name"] == "EIA"
    assert desc["requires_api_key"] is True
    assert desc["writes_db"] is True
    assert desc["output_target"] == "indicators"
    assert desc["source"]  # nicht leer


def test_adapter_describe_distinguishes_key_requirement():
    # GIE-Key ist optional -> requires_api_key False
    assert BNetzAAdapter().describe()["requires_api_key"] is False
    # Tankerkoenig braucht zwingend einen Key
    assert TankerkoenigAdapter().describe()["requires_api_key"] is True
