import json
from datetime import datetime

from src.source_health import SourceHealthRecord, build_source_health, persist_source_health


class FakeAdapter:
    name = "Destatis"

    def describe(self):
        return {
            "name": "Destatis",
            "source": "Destatis GENESIS",
            "output_target": "indicators",
        }


def test_build_source_health_ok_when_items_and_no_errors():
    record = build_source_health(
        FakeAdapter(),
        item_count=1,
        source_errors=[],
        checked_at=datetime(2026, 6, 9, 12, 0, 0),
    )

    assert record.source_id == "destatis"
    assert record.source_name == "Destatis"
    assert record.target == "indicators"
    assert record.status == "ok"
    assert record.item_count == 1
    assert record.error_count == 0
    assert record.last_success_at == "2026-06-09T12:00:00"


def test_build_source_health_failed_when_errors_and_no_items():
    record = build_source_health(
        FakeAdapter(),
        item_count=0,
        source_errors=[{"reason": "HTTP 503", "keep_previous": False}],
        checked_at=datetime(2026, 6, 9, 12, 0, 0),
    )

    assert record.status == "failed"
    assert record.error_count == 1
    assert record.error_messages == ["HTTP 503"]
    assert record.last_success_at is None


def test_build_source_health_degraded_when_keep_previous_errors_and_no_items():
    record = build_source_health(
        FakeAdapter(),
        item_count=0,
        source_errors=[{"reason": "HTTP 503", "keep_previous": True}],
        checked_at=datetime(2026, 6, 9, 12, 0, 0),
    )

    assert record.status == "degraded"
    assert record.error_count == 1
    assert record.error_messages == ["HTTP 503"]
    assert record.last_success_at is None


def test_build_source_health_degraded_when_items_and_errors():
    record = build_source_health(
        FakeAdapter(),
        item_count=1,
        source_errors=[{"reason": "fallback used"}],
        checked_at=datetime(2026, 6, 9, 12, 0, 0),
    )

    assert record.status == "degraded"
    assert record.last_success_at == "2026-06-09T12:00:00"


def test_build_source_health_carries_freshness_context():
    record = build_source_health(
        FakeAdapter(),
        item_count=1,
        source_errors=[],
        checked_at=datetime(2026, 6, 24, 12, 0, 0),
        freshness_status="acceptable-lag",
        freshness_expectation="monthly",
        source_stand="2026-05",
        freshness_reason="monatlich veröffentlichte Quelle; Vormonat ist akzeptabel",
    )

    assert record.freshness_status == "acceptable-lag"
    assert record.freshness_expectation == "monthly"
    assert record.source_stand == "2026-05"
    assert record.freshness_reason.startswith("monatlich")


def test_persist_source_health_writes_jsonl(tmp_path):
    record = SourceHealthRecord(
        source_id="destatis",
        source_name="Destatis",
        target="indicators",
        status="ok",
        last_checked_at="2026-06-09T12:00:00",
        last_success_at="2026-06-09T12:00:00",
        item_count=1,
        error_count=0,
        error_messages=[],
        freshness_status="fresh",
        freshness_expectation="daily",
        source_stand="2026-06-09",
        freshness_reason="daily: Stand höchstens 1 Tag alt",
    )
    path = tmp_path / "source-health.jsonl"

    persist_source_health([record], path)

    lines = path.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 1
    payload = json.loads(lines[0])
    assert payload["source_id"] == "destatis"
    assert payload["status"] == "ok"
    assert payload["freshness_status"] == "fresh"
