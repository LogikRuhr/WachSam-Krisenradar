import json
import uuid
from datetime import datetime
from typing import Optional

import psycopg2

from .config import settings
from .models import IngestionItem


def _append_observation(cur, indicator_id: str, value, date_str: Optional[str], source_stand: str) -> bool:
    """Schreibt eine einzelne Beobachtung in indicator_observations.

    Gibt True zurück wenn der Insert ausgeführt wurde, False wenn übersprungen
    (fehlender Wert oder nicht-parsebares Datum — kein Crash).
    """
    if value is None or date_str is None:
        return False
    try:
        observed_at = datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        # Nicht-parsebares Datum: überspringen, aber nicht crashen
        return False
    cur.execute(
        """INSERT INTO indicator_observations
           (indicator_id, observed_at, value, source_stand)
           VALUES (%s, %s, %s, %s)
           ON CONFLICT (indicator_id, observed_at) DO NOTHING""",
        (indicator_id, observed_at, value, source_stand),
    )
    return True

TABLE_TO_SOURCE_TYPE = {
    "lagebild_items": "lagebild",
    "cost_impacts": "cost",
    "supply_risks": "supply",
    "cascades": "cascade",
    "governance": "governance",
    "indicators": "indicator",
    "citizen_actions": "action",
    "facts": "lagebild",
}


def get_connection():
    return psycopg2.connect(settings.POSTGRES_URL)


# --- Dry-Run-Schutz -----------------------------------------------------------
# Globaler Flag: im Dry-Run oeffnet insert_draft KEINE Verbindung und schreibt
# nichts. Wird vom Orchestrator (main.py --dry-run) via set_dry_run() gesetzt.
_DRY_RUN = False


def set_dry_run(value: bool) -> None:
    """Aktiviert/deaktiviert den globalen Dry-Run-Schutz fuer insert_draft."""
    global _DRY_RUN
    _DRY_RUN = bool(value)


def is_dry_run() -> bool:
    return _DRY_RUN


def insert_draft(item: IngestionItem, item_type: str = "lagebild_items") -> Optional[str]:
    """Schreibt ein IngestionItem als Draft in die Postgres-DB.

    Nutzt die bestehenden Drizzle-Tabellen mit editorial_status='draft'.
    Das Editorial-CMS übernimmt Approve/Publish.

    Im Dry-Run (set_dry_run(True)) wird KEINE Verbindung geoeffnet und nichts
    geschrieben — es wird nur die beabsichtigte Operation geloggt.
    """
    if _DRY_RUN:
        is_indicator = item_type == "indicators" and bool(item.indicator_id)
        op = "UPDATE" if is_indicator else "INSERT"
        item_id = item.indicator_id if is_indicator else "(neue uuid)"
        detail = f" current_value={item.current_value}" if is_indicator else ""
        print(f"[DRY-RUN] {op} {item_type} → {item_id}{detail} — {item.title}")
        return item_id

    item_id = str(uuid.uuid4())
    now = datetime.utcnow()

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if item_type == "lagebild_items":
                cur.execute(
                    """INSERT INTO lagebild_items
                       (id, bereich, titel, beschreibung, severity, trend,
                        primaerindikator, confidence, fact_ids,
                        editorial_status, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, 'draft', %s, %s)""",
                    (
                        item_id,
                        item.affected_systems[0] if item.affected_systems else "energie",
                        item.title,
                        item.description,
                        item.severity_suggestion,
                        "steigend",
                        item.title[:200],
                        item.confidence_suggestion,
                        "[]",
                        now,
                        now,
                    ),
                )
            elif item_type == "facts":
                cur.execute(
                    """INSERT INTO facts
                       (id, category, value_label, source_name, source_url,
                        editorial_status, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, 'draft', %s, %s)""",
                    (
                        item_id,
                        item.affected_systems[0] if item.affected_systems else "allgemein",
                        item.title,
                        item.title,
                        item.source_url,
                        now,
                        now,
                    ),
                )
            elif item_type == "cost_impacts":
                cur.execute(
                    """INSERT INTO cost_impacts
                       (id, bereich, titel, beschreibung, zeithorizont,
                        confidence, editorial_status, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, 'draft', %s, %s)""",
                    (
                        item_id,
                        item.affected_systems[0] if item.affected_systems else "energie",
                        item.title,
                        item.description,
                        item.germany_relevance.time_to_impact,
                        item.confidence_suggestion,
                        now,
                        now,
                    ),
                )

            elif item_type == "indicators" and item.indicator_id:
                # UPDATE existing indicator row with live value — do not INSERT
                cur.execute(
                    """UPDATE indicators
                       SET current_value = %s,
                           current_value_date = %s,
                           previous_value = %s,
                           previous_value_date = %s,
                           last_ingested_at = %s,
                           updated_at = %s
                       WHERE id = %s""",
                    (
                        str(item.current_value) if item.current_value is not None else None,
                        item.current_value_date,
                        str(item.previous_value) if item.previous_value is not None else None,
                        item.previous_value_date,
                        now,
                        now,
                        item.indicator_id,
                    ),
                )
                item_id = item.indicator_id

                # Append-only Historie: current_value und ggf. previous_value eintragen
                source_stand_obs = now.strftime("%B %Y")
                _append_observation(cur, item.indicator_id, item.current_value, item.current_value_date, source_stand_obs)
                # Sofort zwei Punkte Historie wenn previous_value vorhanden
                if item.previous_value is not None and item.previous_value_date is not None:
                    _append_observation(cur, item.indicator_id, item.previous_value, item.previous_value_date, source_stand_obs)

            cur.execute(
                """INSERT INTO editorial_audit_log
                   (id, item_type, item_id, action, from_status, to_status, created_at)
                   VALUES (%s, %s, %s, %s, NULL, %s, %s)""",
                (
                    str(uuid.uuid4()),
                    item_type,
                    item_id,
                    "ingest_value" if (item_type == "indicators" and item.indicator_id) else "create",
                    "published" if (item_type == "indicators" and item.indicator_id) else "draft",
                    now,
                ),
            )

            source_type = TABLE_TO_SOURCE_TYPE.get(item_type, "lagebild")
            source_stand = now.strftime("%B %Y")
            cur.execute(
                """INSERT INTO item_sources
                   (id, item_type, item_id, source_name, source_url, source_stand, order_idx)
                   VALUES (%s, %s, %s, %s, %s, %s, 0)
                   ON CONFLICT DO NOTHING""",
                (str(uuid.uuid4()), source_type, item_id, item.title, item.source_url, source_stand),
            )

            conn.commit()
            print(f"[DB] Draft erstellt: {item_type}/{item_id} — {item.title}")
            return item_id

    except Exception as e:
        conn.rollback()
        print(f"[DB] Insert failed: {e}")
        return None
    finally:
        conn.close()
