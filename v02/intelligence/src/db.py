import json
import uuid
from datetime import datetime
from typing import Optional

import psycopg2

from .config import settings
from .models import IngestionItem
from .source_health import SourceHealthRecord
from .validation import validate_draft, format_validation_reason


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


_MONATE_DE = (
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
)


def _de_date_label(iso: Optional[str]) -> Optional[str]:
    """Deutsches Label aus ISO-Datum/-Zeitraum. None wenn leer/nicht parsebar.

    "2026-05-27" → "27. Mai 2026" · "2026-05" → "Mai 2026" · "2026" → "2026".
    """
    if not iso:
        return None
    s = str(iso).strip()
    try:
        d = datetime.fromisoformat(s)
        return f"{d.day}. {_MONATE_DE[d.month - 1]} {d.year}"
    except (ValueError, TypeError):
        pass
    parts = s.split("-")
    if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
        m = int(parts[1])
        if 1 <= m <= 12:
            return f"{_MONATE_DE[m - 1]} {parts[0]}"
    if len(s) == 4 and s.isdigit():
        return s
    return None


def _resolve_source_stand(item: IngestionItem, value_date: Optional[str], retrieved_at: datetime):
    """Liefert (stand_date_iso | None, stand_label) — verwendet NIE 'now' als
    fachlichen Quellenstand.

    Reihenfolge: explizites item.source_stand_label/-date → reales Wert-Datum →
    defensives Abruf-Label (nur damit NOT-NULL-Spalten befüllt sind, nicht als
    echter Stand). retrieved_at ist der technische Abrufzeitpunkt.
    """
    stand_date = item.source_stand_date or value_date
    label = item.source_stand_label or _de_date_label(stand_date)
    if not label:
        abgerufen = _de_date_label(retrieved_at.date().isoformat()) or retrieved_at.date().isoformat()
        label = f"Quelle ohne ausgewiesenen Stand; abgerufen am {abgerufen}"
    return stand_date, label


def get_connection():
    return psycopg2.connect(settings.POSTGRES_URL)


def fetch_indicator_thresholds(indicator_id: str) -> Optional[dict]:
    """Read-only Lookup der Schwellen eines Indikators für das C3-Gate (Shadow).

    Liefert {threshold_warn, threshold_critical, scale_direction} oder None.
    SCHREIBT NICHTS. Dry-Run-/Fehler-sicher: im Dry-Run, ohne DB, bei Timeout oder
    fehlender Zeile → None (das Gate überspringt C3 dann mit Warnung). Kurzer
    connect_timeout, damit Tests/Umgebungen ohne DB nicht hängen.
    """
    if _DRY_RUN:
        return None
    try:
        conn = psycopg2.connect(settings.POSTGRES_URL, connect_timeout=3)
    except Exception:
        return None
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT threshold_warn, threshold_critical, scale_direction "
                "FROM indicators WHERE id = %s",
                (indicator_id,),
            )
            row = cur.fetchone()
        if not row:
            return None
        return {
            "threshold_warn": row[0],
            "threshold_critical": row[1],
            "scale_direction": row[2] or "higher_is_worse",
        }
    except Exception:
        return None
    finally:
        conn.close()


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


SOURCE_HEALTH_STATUS_MAP = {
    "ok": "fresh",
    "degraded": "stale",
    "failed": "error",
}


def upsert_source_health(records: list[SourceHealthRecord]) -> int:
    """Persistiert aktuellen Source-Health-Zustand additiv in `source_health`.

    Dry-run-safe: im Dry-Run wird keine DB-Verbindung geöffnet. Die JSONL-
    Snapshot-Persistenz bleibt davon getrennt und kann weiterhin genutzt werden.
    """
    if not records:
        return 0
    if _DRY_RUN:
        print(f"[DRY-RUN] source_health upsert übersprungen ({len(records)} Records)")
        return 0

    try:
        conn = get_connection()
    except Exception as e:
        print(f"[DB] source_health upsert failed: {e}")
        return 0

    written = 0
    try:
        with conn.cursor() as cur:
            for record in records:
                status = SOURCE_HEALTH_STATUS_MAP.get(record.status, "unknown")
                cur.execute(
                    """INSERT INTO source_health
                       (source_id, source_name, target, status, last_checked_at,
                        last_success_at, item_count, error_count, error_messages,
                        updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, now())
                       ON CONFLICT (source_id) DO UPDATE
                       SET source_name = EXCLUDED.source_name,
                           target = EXCLUDED.target,
                           status = EXCLUDED.status,
                           last_checked_at = EXCLUDED.last_checked_at,
                           last_success_at = EXCLUDED.last_success_at,
                           item_count = EXCLUDED.item_count,
                           error_count = EXCLUDED.error_count,
                           error_messages = EXCLUDED.error_messages,
                           updated_at = now()""",
                    (
                        record.source_id,
                        record.source_name,
                        record.target,
                        status,
                        record.last_checked_at,
                        record.last_success_at,
                        record.item_count,
                        record.error_count,
                        json.dumps(record.error_messages, ensure_ascii=False),
                    ),
                )
                written += 1
        conn.commit()
        return written
    except Exception as e:
        conn.rollback()
        print(f"[DB] source_health upsert failed: {e}")
        return 0
    finally:
        conn.close()


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

                # Append-only Historie: source_stand = reales Datum der Beobachtung
                # (NICHT now). Jede Beobachtung trägt ihren eigenen Stand.
                _append_observation(
                    cur, item.indicator_id, item.current_value, item.current_value_date,
                    item.source_stand_date or item.current_value_date,
                )
                # Sofort zwei Punkte Historie wenn previous_value vorhanden
                if item.previous_value is not None and item.previous_value_date is not None:
                    _append_observation(
                        cur, item.indicator_id, item.previous_value, item.previous_value_date,
                        item.previous_value_date,
                    )

            # Validierungsergebnis nachvollziehbar im Audit-Log dokumentieren
            # (reason ist nullable; nicht-blockierend, kein Auto-Publish).
            audit_reason = format_validation_reason(validate_draft(item))
            cur.execute(
                """INSERT INTO editorial_audit_log
                   (id, item_type, item_id, action, from_status, to_status, reason, created_at)
                   VALUES (%s, %s, %s, %s, NULL, %s, %s, %s)""",
                (
                    str(uuid.uuid4()),
                    item_type,
                    item_id,
                    "ingest_value" if (item_type == "indicators" and item.indicator_id) else "create",
                    "published" if (item_type == "indicators" and item.indicator_id) else "draft",
                    audit_reason,
                    now,
                ),
            )

            source_type = TABLE_TO_SOURCE_TYPE.get(item_type, "lagebild")
            # source_stand = fachliches DE-Label (nie synthetisch aus now). Bei
            # Indikatoren reales Wert-Datum, sonst explizites Item-Label oder
            # defensiver Abruf-Hinweis (item_sources.source_stand ist NOT NULL).
            indicator_value_date = (
                item.current_value_date if (item_type == "indicators" and item.indicator_id) else None
            )
            _, source_stand_label = _resolve_source_stand(item, indicator_value_date, now)
            cur.execute(
                """INSERT INTO item_sources
                   (id, item_type, item_id, source_name, source_url, source_stand, order_idx)
                   VALUES (%s, %s, %s, %s, %s, %s, 0)
                   ON CONFLICT DO NOTHING""",
                (str(uuid.uuid4()), source_type, item_id, item.title, item.source_url, source_stand_label),
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
