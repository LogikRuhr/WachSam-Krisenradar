import pytest
from unittest.mock import patch, MagicMock
from src.db import insert_draft


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
