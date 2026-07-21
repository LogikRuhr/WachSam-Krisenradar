from datetime import datetime, timezone

from src.editorial_alerts import _reserve_alert, build_message, daily_alert_key, national_state_is_due, parse_recipients


class _Cursor:
    def __init__(self, rows):
        self.rows = iter(rows)
        self.queries = []

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def execute(self, query, params=None):
        self.queries.append((query, params))

    def fetchone(self):
        return next(self.rows)


class _Connection:
    def __init__(self, rows):
        self.cursor_instance = _Cursor(rows)
        self.commits = 0

    def cursor(self):
        return self.cursor_instance

    def commit(self):
        self.commits += 1


def test_national_state_is_due_without_published_state():
    assert national_state_is_due(None, datetime(2026, 7, 21, tzinfo=timezone.utc))


def test_national_state_is_due_without_any_source_when_no_state_is_published():
    assert national_state_is_due(None, None)


def test_national_state_is_due_only_for_newer_source():
    published = datetime(2026, 7, 20, tzinfo=timezone.utc)
    assert not national_state_is_due(published, published)
    assert national_state_is_due(published, datetime(2026, 7, 21, tzinfo=timezone.utc))


def test_daily_alert_key_is_stable_within_one_day():
    assert daily_alert_key(datetime(2026, 7, 21, 8, tzinfo=timezone.utc)) == daily_alert_key(
        datetime(2026, 7, 21, 20, tzinfo=timezone.utc)
    )


def test_alert_reservation_inserts_before_sending():
    connection = _Connection([("reserved-id",)])
    assert _reserve_alert(connection, "national-state-due:2026-07-21")
    assert connection.commits == 1
    assert "ON CONFLICT" in connection.cursor_instance.queries[0][0]


def test_existing_reservation_suppresses_parallel_sender():
    connection = _Connection([None, None])
    assert not _reserve_alert(connection, "national-state-due:2026-07-21")
    assert connection.commits == 1
    assert "delivery_status = 'pending'" in connection.cursor_instance.queries[1][0]


def test_failed_delivery_can_reserve_one_retry():
    connection = _Connection([None, ("retry-id",)])
    assert _reserve_alert(connection, "national-state-due:2026-07-21")
    assert "delivery_status = 'failed'" in connection.cursor_instance.queries[1][0]


def test_recipients_are_trimmed_without_persisting_addresses():
    assert parse_recipients(" editor@example.test,SECOND@example.test ") == ["editor@example.test", "second@example.test"]


def test_message_links_to_mobile_review_without_publish_claim():
    subject, text = build_message("https://wachsam.ruhrlogik.de/")
    assert subject == "WachSam · Gesamtstand braucht Prüfung"
    assert "https://wachsam.ruhrlogik.de/review#gesamtstand" in text
    assert "nichts automatisch" in text
