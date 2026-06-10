import pytest
from datetime import datetime
from unittest.mock import patch, MagicMock, call
from src.db import insert_draft, set_dry_run, upsert_source_health
from src.models import IngestionItem, GermanyRelevance
from src.source_health import SourceHealthRecord


def _make_indicator_item(**kwargs):
    """Erstellt ein minimales IngestionItem für Indikator-Tests."""
    base = dict(
        title="Gasfüllstand",
        description="Füllstand Gasspeicher Deutschland",
        source_url="https://bnetza.de",
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
        indicator_id="gas_storage_level",
        current_value=72.5,
        current_value_date="2026-05-01",
    )
    base.update(kwargs)
    return IngestionItem(**base)


@patch("src.db.get_connection")
def test_insert_draft_calls_db(mock_get_conn, sample_item):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
    mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    mock_get_conn.return_value = mock_conn

    result = insert_draft(sample_item, "lagebild_items")

    assert result is not None
    assert mock_cursor.execute.called
    assert mock_conn.commit.called
    mock_conn.close.assert_called_once()


@patch("src.db.get_connection")
def test_insert_draft_handles_error(mock_get_conn, sample_item):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_cursor.execute.side_effect = Exception("DB error")
    mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
    mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    mock_get_conn.return_value = mock_conn

    result = insert_draft(sample_item, "lagebild_items")

    assert result is None
    assert mock_conn.rollback.called
    mock_conn.close.assert_called_once()


@patch("src.db.get_connection")
def test_insert_draft_facts(mock_get_conn, sample_item):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
    mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    mock_get_conn.return_value = mock_conn

    result = insert_draft(sample_item, "facts")
    assert result is not None


# ---------------------------------------------------------------------------
# indicator_observations Tests
# ---------------------------------------------------------------------------

def _setup_mock_conn():
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
    mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    return mock_conn, mock_cursor


def _observation_sqls(mock_cursor):
    """Gibt alle SQL-Strings zurück, die 'indicator_observations' enthalten."""
    return [
        str(c.args[0])
        for c in mock_cursor.execute.call_args_list
        if "indicator_observations" in str(c.args[0])
    ]


@patch("src.db.get_connection")
def test_indicator_ingest_writes_one_observation(mock_get_conn):
    """Beim Indikator-Ingest muss mindestens ein INSERT in indicator_observations erfolgen."""
    mock_conn, mock_cursor = _setup_mock_conn()
    mock_get_conn.return_value = mock_conn

    item = _make_indicator_item()
    result = insert_draft(item, "indicators")

    assert result == "gas_storage_level"
    obs_sqls = _observation_sqls(mock_cursor)
    assert len(obs_sqls) >= 1, "Kein INSERT in indicator_observations gefunden"
    assert "ON CONFLICT" in obs_sqls[0]
    assert mock_conn.commit.called


@patch("src.db.get_connection")
def test_indicator_ingest_writes_two_observations_when_previous_present(mock_get_conn):
    """Mit previous_value + previous_value_date müssen ZWEI Observation-Inserts ausgeführt werden."""
    mock_conn, mock_cursor = _setup_mock_conn()
    mock_get_conn.return_value = mock_conn

    item = _make_indicator_item(
        previous_value=68.0,
        previous_value_date="2026-04-01",
    )
    insert_draft(item, "indicators")

    obs_sqls = _observation_sqls(mock_cursor)
    assert len(obs_sqls) == 2, f"Erwartet 2 Observation-Inserts, gefunden: {len(obs_sqls)}"


@patch("src.db.get_connection")
def test_indicator_ingest_bad_date_does_not_crash(mock_get_conn):
    """Nicht-parsebares current_value_date darf keinen Crash verursachen.

    UPDATE und commit müssen trotzdem laufen; kein indicator_observations-Insert.
    """
    mock_conn, mock_cursor = _setup_mock_conn()
    mock_get_conn.return_value = mock_conn

    item = _make_indicator_item(current_value_date="kein-datum-xxx")
    result = insert_draft(item, "indicators")

    # Kein Crash → result ist indicator_id (nicht None)
    assert result == "gas_storage_level"
    assert mock_conn.commit.called
    # Kein Observation-Insert erwartet
    obs_sqls = _observation_sqls(mock_cursor)
    assert len(obs_sqls) == 0, f"Unerwarteter Observation-Insert bei ungültigem Datum: {obs_sqls}"


# ---------------------------------------------------------------------------
# source_health DB persistence Tests
# ---------------------------------------------------------------------------

def _source_health_record(**kwargs):
    base = dict(
        source_id="dwd",
        source_name="DWD",
        target="indicators",
        status="ok",
        last_checked_at="2026-06-10T03:30:00+00:00",
        last_success_at="2026-06-10T03:30:00+00:00",
        item_count=1,
        error_count=0,
        error_messages=[],
    )
    base.update(kwargs)
    return SourceHealthRecord(**base)


@patch("src.db.get_connection")
def test_upsert_source_health_writes_current_status(mock_get_conn):
    mock_conn, mock_cursor = _setup_mock_conn()
    mock_get_conn.return_value = mock_conn

    result = upsert_source_health([_source_health_record()])

    assert result == 1
    sqls = [str(c.args[0]) for c in mock_cursor.execute.call_args_list]
    assert any("INSERT INTO source_health" in sql for sql in sqls)
    assert any("ON CONFLICT (source_id) DO UPDATE" in sql for sql in sqls)
    args = mock_cursor.execute.call_args_list[0].args[1]
    assert args[0] == "dwd"
    assert args[3] == "fresh"
    assert args[8] == "[]"
    assert mock_conn.commit.called
    mock_conn.close.assert_called_once()


@patch("src.db.get_connection")
def test_upsert_source_health_maps_failed_to_error_and_rolls_back(mock_get_conn):
    mock_conn, mock_cursor = _setup_mock_conn()
    mock_cursor.execute.side_effect = Exception("DB error")
    mock_get_conn.return_value = mock_conn

    result = upsert_source_health([
        _source_health_record(status="failed", error_count=1, error_messages=["HTTP 503"])
    ])

    assert result == 0
    args = mock_cursor.execute.call_args_list[0].args[1]
    assert args[3] == "error"
    assert mock_conn.rollback.called
    mock_conn.close.assert_called_once()


@patch("src.db.get_connection")
def test_upsert_source_health_dry_run_does_not_open_db(mock_get_conn):
    set_dry_run(True)
    try:
        assert upsert_source_health([_source_health_record()]) == 0
    finally:
        set_dry_run(False)

    mock_get_conn.assert_not_called()
