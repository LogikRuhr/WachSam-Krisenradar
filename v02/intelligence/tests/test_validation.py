"""Tests für die Fact-to-Impact-Draft-Validierung (Kanon-Check, nicht-blockierend)."""
import json
from datetime import datetime

import pytest

from src import db
from src.models import GermanyRelevance, IngestionItem
from src.validation import validate_draft, format_validation_reason


def _item(**kwargs):
    defaults = dict(
        title="Test",
        description="Eine Beschreibung",
        source_url="https://example.com",
        source_class="behoerde",
        last_ingested_at=datetime(2026, 6, 3, 12, 0),
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["energie"],
            time_to_impact="wochen",
            description="DE-relevant",
        ),
        methodology_tag="steep",
        affected_systems=["energie"],
        severity_suggestion="beobachten",
        confidence_suggestion="mittel",
        source_stand_label="Mai 2026",
    )
    defaults.update(kwargs)
    return IngestionItem(**defaults)


def test_valid_draft_has_no_errors():
    res = validate_draft(_item())
    assert res.valid is True
    assert res.errors == []
    assert res.warnings == []


def test_off_canon_severity_is_error():
    res = validate_draft(_item(severity_suggestion="panik"))
    assert res.valid is False
    assert any("severity" in e for e in res.errors)


def test_off_canon_confidence_is_error():
    res = validate_draft(_item(confidence_suggestion="vielleicht"))
    assert any("confidence" in e for e in res.errors)


def test_off_canon_methodology_is_error():
    res = validate_draft(_item(methodology_tag="bauchgefuehl"))
    assert any("methodology_tag" in e for e in res.errors)


def test_off_canon_time_to_impact_is_error():
    item = _item(
        germany_relevance=GermanyRelevance(
            direct=True, systems_affected=["energie"], time_to_impact="irgendwann", description="x"
        )
    )
    assert any("time_to_impact" in e for e in validate_draft(item).errors)


def test_off_canon_system_in_germany_relevance_is_error():
    item = _item(
        germany_relevance=GermanyRelevance(
            direct=True, systems_affected=["weltraum"], time_to_impact="wochen", description="x"
        )
    )
    assert any("Systembereich" in e for e in validate_draft(item).errors)


def test_missing_source_url_is_error():
    res = validate_draft(_item(source_url=""))
    assert any("source_url" in e for e in res.errors)


def test_empty_description_is_warning_not_error():
    res = validate_draft(_item(description="   "))
    assert res.valid is True  # nur Hinweis, kein Fehler
    assert any("description leer" in w for w in res.warnings)


def test_missing_source_stand_is_warning():
    res = validate_draft(_item(source_stand_label=None, source_stand_date=None))
    assert res.valid is True
    assert any("source_stand" in w for w in res.warnings)


def test_off_canon_affected_systems_is_warning():
    res = validate_draft(_item(affected_systems=["energie", "raumfahrt"]))
    assert res.valid is True
    assert any("affected_systems" in w for w in res.warnings)


def test_all_canon_values_accepted():
    for sev in ("stabil", "beobachten", "erhöht", "kritisch", "eskalierend"):
        assert validate_draft(_item(severity_suggestion=sev)).valid
    for conf in ("hoch", "mittel", "niedrig"):
        assert validate_draft(_item(confidence_suggestion=conf)).valid
    for tag in ("steep", "rca", "bia", "fmea", "scenario"):
        assert validate_draft(_item(methodology_tag=tag)).valid


# --- format_validation_reason ------------------------------------------------
def test_format_reason_clean_is_none():
    assert format_validation_reason(validate_draft(_item())) is None


def test_format_reason_contains_errors_and_warnings():
    item = _item(severity_suggestion="panik", source_stand_label=None, source_stand_date=None)
    reason = format_validation_reason(validate_draft(item))
    assert reason is not None
    payload = json.loads(reason)
    assert any("severity" in e for e in payload["validation_errors"])
    assert any("source_stand" in w for w in payload["validation_warnings"])


# --- Audit-Log-reason (über insert_draft, ohne echte DB) ---------------------
class _Cur:
    def __init__(self):
        self.calls = []

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def execute(self, sql, params=None):
        self.calls.append((sql, params))


class _Conn:
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


@pytest.fixture(autouse=True)
def _no_dry_run():
    db.set_dry_run(False)
    yield
    db.set_dry_run(False)


def _audit_params(cur):
    for sql, params in cur.calls:
        if "editorial_audit_log" in sql:
            return params
    return None


def test_invalid_draft_writes_validation_reason_to_audit_log(monkeypatch):
    cur = _Cur()
    monkeypatch.setattr(db, "get_connection", lambda: _Conn(cur))
    item = _item(severity_suggestion="panik")  # Kanon-Fehler
    db.insert_draft(item, "lagebild_items")

    reason = _audit_params(cur)[5]  # (id, item_type, item_id, action, to_status, reason, created_at)
    assert reason is not None
    payload = json.loads(reason)
    assert any("severity" in e for e in payload["validation_errors"])


def test_clean_draft_audit_reason_is_none(monkeypatch):
    cur = _Cur()
    monkeypatch.setattr(db, "get_connection", lambda: _Conn(cur))
    db.insert_draft(_item(), "lagebild_items")

    assert _audit_params(cur)[5] is None
