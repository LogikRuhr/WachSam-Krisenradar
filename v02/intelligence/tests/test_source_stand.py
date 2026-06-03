"""Tests für den source_stand-Fix.

Ziel: db.py gibt KEINEN synthetischen now-Quellenstand mehr als fachlichen
source_stand aus. Statt "June 2026" (now) → reales Wert-Datum bzw. defensiver
Abruf-Hinweis.
"""
from datetime import datetime

import pytest

from src import db
from src.db import _de_date_label, _resolve_source_stand
from src.models import GermanyRelevance, IngestionItem


@pytest.fixture(autouse=True)
def _no_dry_run():
    db.set_dry_run(False)
    yield
    db.set_dry_run(False)


# --- FakeCursor/-Conn, die ausgeführte SQL + Params aufzeichnen --------------
class FakeCursor:
    def __init__(self):
        self.calls = []

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def execute(self, sql, params=None):
        self.calls.append((sql, params))


class FakeConn:
    def __init__(self, cur):
        self._cur = cur

    def cursor(self):
        return self._cur

    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        pass


def _params_for(cur, table):
    for sql, params in cur.calls:
        if table in sql:
            return params
    return None


def _all_params_for(cur, table):
    return [params for sql, params in cur.calls if table in sql]


def _base_item(**kwargs):
    defaults = dict(
        title="Test",
        description="Desc",
        source_url="https://example.com",
        source_class="behoerde",
        last_ingested_at=datetime(2026, 6, 3, 12, 0),
        germany_relevance=GermanyRelevance(
            direct=True, systems_affected=["energie"], time_to_impact="wochen", description="x"
        ),
        methodology_tag="steep",
        affected_systems=["energie"],
    )
    defaults.update(kwargs)
    return IngestionItem(**defaults)


# --- _de_date_label ----------------------------------------------------------
def test_de_date_label_full_date():
    assert _de_date_label("2026-05-27") == "27. Mai 2026"


def test_de_date_label_month():
    assert _de_date_label("2026-05") == "Mai 2026"


def test_de_date_label_year():
    assert _de_date_label("2026") == "2026"


def test_de_date_label_invalid_or_empty():
    assert _de_date_label("keinDatum") is None
    assert _de_date_label(None) is None
    assert _de_date_label("") is None


# --- _resolve_source_stand ---------------------------------------------------
def test_resolve_prefers_explicit_label():
    item = _base_item(source_stand_label="Mai 2026", source_stand_date="2026-05")
    stand_date, label = _resolve_source_stand(item, None, datetime(2026, 6, 3))
    assert stand_date == "2026-05"
    assert label == "Mai 2026"


def test_resolve_derives_label_from_value_date():
    item = _base_item()
    stand_date, label = _resolve_source_stand(item, "2026-05-27", datetime(2026, 6, 3))
    assert stand_date == "2026-05-27"
    assert label == "27. Mai 2026"


def test_resolve_defensive_when_no_stand():
    item = _base_item()
    stand_date, label = _resolve_source_stand(item, None, datetime(2026, 6, 3))
    assert stand_date is None
    assert label.startswith("Quelle ohne ausgewiesenen Stand; abgerufen am")
    assert "3. Juni 2026" in label


# --- insert_draft: kein synthetischer now-Stand mehr -------------------------
def test_item_sources_indicator_uses_real_value_date(monkeypatch):
    cur = FakeCursor()
    monkeypatch.setattr(db, "get_connection", lambda: FakeConn(cur))
    item = _base_item(
        indicator_id="wi-test", current_value=72.5, current_value_date="2026-05-27",
        last_ingested_at=datetime(2026, 6, 3, 12, 0),
    )
    db.insert_draft(item, "indicators")

    item_sources_params = _params_for(cur, "item_sources")
    source_stand = item_sources_params[5]
    assert source_stand == "27. Mai 2026"
    # kein englischer now-Monat (alte Fabrikation)
    assert "June" not in source_stand


def test_indicator_observation_source_stand_is_value_date(monkeypatch):
    cur = FakeCursor()
    monkeypatch.setattr(db, "get_connection", lambda: FakeConn(cur))
    item = _base_item(
        indicator_id="wi-test", current_value=72.5, current_value_date="2026-05-27",
        previous_value=71.9, previous_value_date="2026-05-26",
    )
    db.insert_draft(item, "indicators")

    obs = _all_params_for(cur, "indicator_observations")
    # params: (indicator_id, observed_at, value, source_stand)
    assert obs[0][3] == "2026-05-27"
    assert obs[1][3] == "2026-05-26"
    for params in obs:
        assert "June" not in str(params[3])


def test_item_sources_non_indicator_without_stand_is_defensive(monkeypatch):
    cur = FakeCursor()
    monkeypatch.setattr(db, "get_connection", lambda: FakeConn(cur))
    item = _base_item(last_ingested_at=datetime(2026, 6, 3, 12, 0))
    db.insert_draft(item, "lagebild_items")

    source_stand = _params_for(cur, "item_sources")[5]
    assert source_stand.startswith("Quelle ohne ausgewiesenen Stand; abgerufen am")
    # niemals ein fabrizierter Periodenstand
    assert "June 2026" not in source_stand


def test_explicit_label_wins_for_non_indicator(monkeypatch):
    cur = FakeCursor()
    monkeypatch.setattr(db, "get_connection", lambda: FakeConn(cur))
    item = _base_item(source_stand_label="KW 22/2026")
    db.insert_draft(item, "lagebild_items")

    assert _params_for(cur, "item_sources")[5] == "KW 22/2026"
