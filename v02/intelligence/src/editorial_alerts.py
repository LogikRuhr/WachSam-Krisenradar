"""Begrenzte, datensparsame Erinnerungen für den redaktionellen Gesamtstand."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Iterable

import requests

from .config import settings


ALERT_KIND = "national_state_due"


def parse_recipients(raw: str | None) -> list[str]:
    """Liest die bestehende Operator-Allowlist, ohne sie zu persistieren."""
    return [value.strip().lower() for value in (raw or "").split(",") if value.strip()]


def national_state_is_due(published_stand: datetime | None, latest_source_success: datetime | None) -> bool:
    """Ein fehlender oder älterer veröffentlichter Stand braucht eine Redaktion."""
    if published_stand is None:
        return True
    return latest_source_success is not None and latest_source_success > published_stand


def daily_alert_key(now: datetime) -> str:
    return f"{ALERT_KIND}:{now.astimezone(timezone.utc).date().isoformat()}"


def build_message(public_url: str) -> tuple[str, str]:
    review_url = f"{public_url.rstrip('/')}/review#gesamtstand"
    subject = "WachSam · Gesamtstand braucht Prüfung"
    text = (
        "Es gibt keinen veröffentlichten Gesamtstand oder eine Quelle ist neuer als der letzte Gesamtstand. "
        f"Bitte den Gesamtstand auf dem Smartphone prüfen: {review_url}\n\n"
        "Die Nachricht veröffentlicht nichts automatisch."
    )
    return subject, text


def _latest_due_context(conn) -> tuple[datetime | None, datetime | None]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT MAX(last_success_at) FROM source_health "
            "WHERE status = 'fresh' AND last_success_at IS NOT NULL"
        )
        latest_source_success = cur.fetchone()[0]
        cur.execute(
            "SELECT MAX(stand_date) FROM national_state WHERE editorial_status = 'published'"
        )
        published_stand = cur.fetchone()[0]
    return published_stand, latest_source_success


def _reserve_alert(conn, alert_key: str) -> bool:
    """Reserviert den Tages-Schlüssel vor dem Versand atomar.

    Ein fehlgeschlagener Versand wird später erneut reservierbar; ein parallel
    laufender Scheduler erhält dagegen keinen zweiten Versand-Slot.
    """
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO editorial_alerts (id, alert_key, alert_kind, delivery_status) "
            "VALUES (%s, %s, %s, 'pending') ON CONFLICT (alert_key) DO NOTHING RETURNING id",
            (str(uuid.uuid4()), alert_key, ALERT_KIND),
        )
        if cur.fetchone() is not None:
            conn.commit()
            return True
        cur.execute(
            "UPDATE editorial_alerts SET delivery_status = 'pending', attempted_at = now() "
            "WHERE alert_key = %s AND (delivery_status = 'failed' "
            "OR (delivery_status = 'pending' AND attempted_at < now() - interval '15 minutes')) "
            "RETURNING id",
            (alert_key,),
        )
        reserved = cur.fetchone() is not None
    conn.commit()
    return reserved


def _record_delivery(conn, alert_key: str, status: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE editorial_alerts SET delivery_status = %s, sent_at = "
            "CASE WHEN %s = 'sent' THEN now() ELSE NULL END WHERE alert_key = %s",
            (status, status, alert_key),
        )
    conn.commit()


def _send_resend(recipients: Iterable[str], subject: str, text: str) -> bool:
    addresses = list(recipients)
    if not addresses:
        return False
    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {os.environ.get('RESEND_API_KEY', '')}",
            "Content-Type": "application/json",
        },
        json={
            "from": os.environ.get("AUTH_EMAIL_FROM", "wachsam@ruhrlogik.de"),
            "to": [addresses[0]],
            "bcc": addresses[1:],
            "subject": subject,
            "text": text,
        },
        timeout=15,
    )
    return response.ok


def notify_national_state_if_due(now: datetime | None = None) -> str:
    """Versendet maximal eine Gesamtstand-Erinnerung pro UTC-Tag.

    Fehler bleiben vom Ingestion-Lauf getrennt: fehlende Konfiguration,
    Datenbank- oder Versandfehler publizieren nichts und stoppen keine Quellen.
    """
    if not os.environ.get("RESEND_API_KEY"):
        return "disabled"
    recipients = parse_recipients(os.environ.get("ADMIN_EMAILS"))
    if not recipients:
        return "disabled"

    now = now or datetime.now(timezone.utc)
    alert_key = daily_alert_key(now)
    try:
        import psycopg2

        conn = psycopg2.connect(settings.POSTGRES_URL, connect_timeout=5)
    except Exception:
        return "db-unavailable"

    try:
        published_stand, latest_source_success = _latest_due_context(conn)
        if not national_state_is_due(published_stand, latest_source_success):
            return "not-due"
        if not _reserve_alert(conn, alert_key):
            return "suppressed"

        subject, text = build_message(os.environ.get("WACHSAM_PUBLIC_URL", "https://wachsam.ruhrlogik.de"))
        try:
            sent = _send_resend(recipients, subject, text)
        except Exception:
            sent = False
        if not sent:
            _record_delivery(conn, alert_key, "failed")
            return "send-failed"
        _record_delivery(conn, alert_key, "sent")
        return "sent"
    except Exception:
        conn.rollback()
        return "failed"
    finally:
        conn.close()
