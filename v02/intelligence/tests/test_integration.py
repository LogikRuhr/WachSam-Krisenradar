"""
Integration-Tests für die Intelligence-Pipeline gegen lokale Postgres-DB.

Voraussetzung: wachsam-v02-postgres Container läuft auf localhost:5432.
Wird übersprungen wenn DB nicht erreichbar.
"""
import os
import pytest
from datetime import datetime

from src.models import IngestionItem, GermanyRelevance
from src.db import get_connection, insert_draft


def db_available():
    try:
        conn = get_connection()
        conn.close()
        return True
    except Exception:
        return False


skipdb = pytest.mark.skipif(not db_available(), reason="Postgres nicht erreichbar")


def make_item(title: str) -> IngestionItem:
    return IngestionItem(
        title=title,
        description=f"Integration test: {title}",
        source_url="https://example.com/test",
        source_class="behoerde",
        last_ingested_at=datetime.utcnow(),
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["energie"],
            time_to_impact="wochen",
            description="Test-Item für Integration",
        ),
        methodology_tag="steep",
        affected_systems=["energie"],
    )


@skipdb
class TestDBIntegration:
    def test_insert_draft_creates_row(self):
        item = make_item(f"Integration Test {datetime.utcnow().isoformat()}")
        draft_id = insert_draft(item, "lagebild_items")
        assert draft_id is not None

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT editorial_status FROM lagebild_items WHERE id = %s",
                    (draft_id,),
                )
                row = cur.fetchone()
                assert row is not None
                assert row[0] == "draft"
        finally:
            # Cleanup
            with conn.cursor() as cur:
                cur.execute("DELETE FROM editorial_audit_log WHERE item_id = %s", (draft_id,))
                cur.execute("DELETE FROM item_sources WHERE item_id = %s", (draft_id,))
                cur.execute("DELETE FROM lagebild_items WHERE id = %s", (draft_id,))
                conn.commit()
            conn.close()

    def test_insert_draft_creates_audit_log(self):
        item = make_item(f"Audit Log Test {datetime.utcnow().isoformat()}")
        draft_id = insert_draft(item, "lagebild_items")

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT action, to_status FROM editorial_audit_log WHERE item_id = %s",
                    (draft_id,),
                )
                row = cur.fetchone()
                assert row is not None
                assert row[0] == "create"
                assert row[1] == "draft"
        finally:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM editorial_audit_log WHERE item_id = %s", (draft_id,))
                cur.execute("DELETE FROM item_sources WHERE item_id = %s", (draft_id,))
                cur.execute("DELETE FROM lagebild_items WHERE id = %s", (draft_id,))
                conn.commit()
            conn.close()

    def test_draft_not_visible_in_published(self):
        item = make_item(f"Visibility Test {datetime.utcnow().isoformat()}")
        draft_id = insert_draft(item, "lagebild_items")

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT count(*) FROM lagebild_items WHERE id = %s AND editorial_status = 'published'",
                    (draft_id,),
                )
                count = cur.fetchone()[0]
                assert count == 0, "Draft darf NICHT als published sichtbar sein"
        finally:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM editorial_audit_log WHERE item_id = %s", (draft_id,))
                cur.execute("DELETE FROM item_sources WHERE item_id = %s", (draft_id,))
                cur.execute("DELETE FROM lagebild_items WHERE id = %s", (draft_id,))
                conn.commit()
            conn.close()


@pytest.mark.live
@skipdb
class TestFullPipeline:
    def test_all_adapters_produce_items(self):
        from src.adapters.destatis import DestatisAdapter
        from src.adapters.bnetza import BNetzAAdapter
        from src.adapters.fao import FAOAdapter
        from src.adapters.eurostat import EurostatAdapter
        from src.adapters.warning_indicators import WarningIndicatorsAdapter

        for AdapterClass in [DestatisAdapter, BNetzAAdapter, FAOAdapter, EurostatAdapter]:
            adapter = AdapterClass()
            items = adapter.fetch_latest()
            assert len(items) >= 1, f"{adapter.name} liefert keine Items"
            for item in items:
                assert item.title, f"{adapter.name}: Item ohne Titel"
                assert item.source_url.startswith("https://"), f"{adapter.name}: URL ungültig"
                assert item.germany_relevance.description, f"{adapter.name}: Keine DE-Relevanz"

    def test_adapter_items_persist_as_drafts(self):
        from src.adapters.destatis import DestatisAdapter

        adapter = DestatisAdapter()
        items = adapter.fetch_latest()
        assert len(items) >= 1

        draft_ids = []
        for item in items:
            draft_id = insert_draft(item, "lagebild_items")
            assert draft_id is not None
            draft_ids.append(draft_id)

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                for did in draft_ids:
                    cur.execute(
                        "SELECT editorial_status FROM lagebild_items WHERE id = %s",
                        (did,),
                    )
                    row = cur.fetchone()
                    assert row is not None
                    assert row[0] == "draft"
        finally:
            with conn.cursor() as cur:
                for did in draft_ids:
                    cur.execute("DELETE FROM editorial_audit_log WHERE item_id = %s", (did,))
                    cur.execute("DELETE FROM item_sources WHERE item_id = %s", (did,))
                    cur.execute("DELETE FROM lagebild_items WHERE id = %s", (did,))
                conn.commit()
            conn.close()
