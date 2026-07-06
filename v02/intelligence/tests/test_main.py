import asyncio
import inspect
import json
from datetime import datetime
from types import SimpleNamespace

from src import main
from src.models import GermanyRelevance, IngestionItem


class EmptyAdapter:
    name = "Empty"

    def describe(self):
        return {
            "name": self.name,
            "source": "empty fake",
            "requires_api_key": False,
            "writes_db": False,
            "output_target": "facts",
        }

    def fetch_latest(self):
        return []


class EmptyCrawler:
    def fetch_all(self):
        return []


_ALL_ADAPTER_ATTRS = (
    "DestatisAdapter", "BNetzAAdapter", "EIAAdapter", "FREDAdapter",
    "FAOAdapter", "TankerkoenigAdapter", "PegelonlineAdapter", "DWDAdapter",
    "NINAAdapter",
    "EurostatAdapter", "WarningIndicatorsAdapter",
    "BIPAdapter", "ArbeitslosigkeitAdapter", "EZBLeitzinsAdapter",
    "StaatsschuldenAdapter", "InsolvenzenAdapter",
)


def test_run_ingestion_resets_llm_runtime_state_at_run_start(monkeypatch):
    reset_calls = []

    for attr in _ALL_ADAPTER_ATTRS:
        monkeypatch.setattr(main, attr, EmptyAdapter)
    monkeypatch.setattr(main, "reset_llm_runtime_state", lambda: reset_calls.append("reset"), raising=False)

    asyncio.run(main.run_ingestion(dry_run=True, allow_fetch=False))

    assert reset_calls == ["reset"]


def test_run_scheduled_is_coroutine_function():
    assert inspect.iscoroutinefunction(main.run_scheduled)


def test_main_scheduled_starts_scheduler_with_created_event_loop(monkeypatch):
    events = []

    class FakeLoop:
        def run_forever(self):
            events.append("run_forever")

        def close(self):
            events.append("close")

    class FakeScheduler:
        def __init__(self, event_loop=None):
            events.append(("scheduler", event_loop))

        def add_job(self, job, trigger, hour, minute, id):
            events.append(("job", job, trigger, hour, minute, id))

        def start(self):
            events.append("start")

        def shutdown(self):
            events.append("shutdown")

    fake_loop = FakeLoop()
    monkeypatch.setenv("INGESTION_MODE", "scheduled")
    monkeypatch.setattr(main.asyncio, "new_event_loop", lambda: fake_loop)
    monkeypatch.setattr(main.asyncio, "set_event_loop", lambda loop: events.append(("set_loop", loop)))
    monkeypatch.setattr(main, "AsyncIOScheduler", FakeScheduler)

    main.main([])

    assert ("set_loop", fake_loop) in events
    assert ("scheduler", fake_loop) in events
    assert ("job", main.run_scheduled, "cron", 6, 0, "morning") in events
    assert ("job", main.run_scheduled, "cron", 18, 0, "evening") in events
    assert events.index("start") < events.index("run_forever")
    assert "shutdown" in events
    assert "close" in events


def test_run_ingestion_routes_bnetza_indicator_items_to_indicator_updates(monkeypatch):
    bnetza_item = IngestionItem(
        title="Gasspeicher Deutschland: 72.5% (2026-05-27)",
        description="Aktueller Fuellstand deutscher Gasspeicher: 72.5%.",
        source_url="https://agsi.gie.eu/",
        source_class="behoerde",
        last_ingested_at=datetime.utcnow(),
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["energie", "industrie"],
            time_to_impact="kurzfristig",
            description="Gasspeicher-Fuellstand ist relevant fuer Energieversorgung.",
        ),
        methodology_tag="scenario",
        affected_systems=["energie", "industrie"],
        indicator_id="wi-gasspeicher-fuellstand",
        current_value=72.5,
        current_value_date="2026-05-27",
        previous_value=71.9,
        previous_value_date="2026-05-26",
    )

    class FakeBNetzAAdapter:
        name = "BNetzA"

        def fetch_latest(self):
            return [bnetza_item]

    for attr in _ALL_ADAPTER_ATTRS:
        if attr != "BNetzAAdapter":
            monkeypatch.setattr(main, attr, EmptyAdapter)
    monkeypatch.setattr(main, "BNetzAAdapter", FakeBNetzAAdapter)
    monkeypatch.setattr(main, "RSSCrawler", EmptyCrawler)

    inserted = []

    def fake_insert_draft(item, item_type):
        inserted.append((item, item_type))
        return item.indicator_id or "draft-id"

    monkeypatch.setattr(main, "insert_draft", fake_insert_draft)

    asyncio.run(main.run_ingestion())

    assert inserted == [(bnetza_item, "indicators")]


def _bnetza_item(**kwargs):
    base = dict(
        title="Gasspeicher Deutschland: 72.5% (2026-05-27)",
        description="Aktueller Fuellstand deutscher Gasspeicher: 72.5%.",
        source_url="https://agsi.gie.eu/",
        source_class="behoerde",
        last_ingested_at=datetime.utcnow(),
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["energie"],
            time_to_impact="kurzfristig",
            description="Gasspeicher-Fuellstand relevant.",
        ),
        methodology_tag="scenario",
        affected_systems=["energie"],
        indicator_id="wi-gasspeicher-fuellstand",
        current_value=72.5,
        current_value_date="2026-05-27",
        previous_value=71.9,
        previous_value_date="2026-05-26",
    )
    base.update(kwargs)
    return IngestionItem(**base)


def test_shadow_logs_json_and_does_not_alter_insert_path(monkeypatch, capsys):
    """W6a: Shadow-Gate loggt strukturiertes JSON, lässt den Insert-Pfad unverändert."""
    item = _bnetza_item()

    class FakeBNetzAAdapter:
        name = "BNetzA"

        def fetch_latest(self):
            return [item]

    for attr in _ALL_ADAPTER_ATTRS:
        if attr != "BNetzAAdapter":
            monkeypatch.setattr(main, attr, EmptyAdapter)
    monkeypatch.setattr(main, "BNetzAAdapter", FakeBNetzAAdapter)
    monkeypatch.setattr(main, "RSSCrawler", EmptyCrawler)
    # Hermetisch halten: keine echte DB-Verbindung für die C3-Schwellen.
    monkeypatch.setattr(main, "fetch_indicator_thresholds", lambda _id: None)

    inserted = []

    def fake_insert_draft(it, item_type):
        inserted.append((it, item_type))
        return it.indicator_id or "draft-id"

    monkeypatch.setattr(main, "insert_draft", fake_insert_draft)

    asyncio.run(main.run_ingestion())

    # Insert-Pfad unverändert (Shadow greift NICHT ein).
    assert inserted == [(item, "indicators")]

    # Genau eine strukturierte Shadow-JSON-Zeile mit allen Pflichtfeldern.
    shadow_lines = []
    for line in capsys.readouterr().out.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        if obj.get("event") == "plausibility_gate_shadow":
            shadow_lines.append(obj)

    assert len(shadow_lines) == 1
    log = shadow_lines[0]
    required = {
        "event", "indicator_id", "raw_value", "parsed_value", "previous_value",
        "gate_class", "would_action", "reason", "source_name", "source_stand", "observed_at",
    }
    assert required.issubset(log.keys())
    assert log["indicator_id"] == "wi-gasspeicher-fuellstand"
    assert log["parsed_value"] == 72.5
    assert log["previous_value"] == 71.9


def test_keep_previous_gate_skips_indicator_update(monkeypatch, capsys):
    item = _bnetza_item(
        title="Gasspeicher Deutschland: 150% (2026-05-27)",
        current_value=150.0,
        previous_value=72.0,
    )

    class FakeBNetzAAdapter:
        name = "BNetzA"

        def fetch_latest(self):
            return [item]

    for attr in _ALL_ADAPTER_ATTRS:
        if attr != "BNetzAAdapter":
            monkeypatch.setattr(main, attr, EmptyAdapter)
    monkeypatch.setattr(main, "BNetzAAdapter", FakeBNetzAAdapter)
    monkeypatch.setattr(main, "RSSCrawler", EmptyCrawler)
    monkeypatch.setattr(main, "fetch_indicator_thresholds", lambda _id: None)
    monkeypatch.setattr(main, "upsert_source_health", lambda records: len(records))

    inserted = []
    monkeypatch.setattr(main, "insert_draft", lambda it, t: inserted.append((it, t)) or "id")

    asyncio.run(main.run_ingestion())

    assert inserted == []
    shadow_lines = _collect_shadow_lines(capsys)
    assert shadow_lines[0]["gate_class"] == "C1"
    assert shadow_lines[0]["would_action"] == "keep_previous_value"


def _lagebild_item():
    """Nicht-Indikator-Item (Pfad B): KEIN indicator_id → kein Shadow-Gate."""
    return IngestionItem(
        title="Behörde warnt vor Lieferengpässen",
        description="Eine Meldung ohne numerischen Messwert.",
        source_url="https://example.gov/meldung",
        source_class="qualitaetsmedien",
        last_ingested_at=datetime.utcnow(),
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["logistik"],
            time_to_impact="wochen",
            description="Lieferketten betroffen.",
        ),
        methodology_tag="scenario",
        affected_systems=["logistik"],
        # KEIN indicator_id → resolve_item_type() liefert "lagebild_items".
    )


def test_non_indicator_item_skips_shadow_gate(monkeypatch, capsys):
    """W6a: Pfad-B-Items (ohne indicator_id) durchlaufen das Shadow-Gate NICHT.

    Erwartung: kein plausibility_gate_shadow-JSON, kein Threshold-Lookup,
    insert_draft unverändert aufgerufen (Nicht-Indikator-Typ).
    """
    item = _lagebild_item()

    class FakeMediaAdapter:
        name = "Media"

        def fetch_latest(self):
            return [item]

    for attr in _ALL_ADAPTER_ATTRS:
        if attr != "DestatisAdapter":
            monkeypatch.setattr(main, attr, EmptyAdapter)
    monkeypatch.setattr(main, "DestatisAdapter", FakeMediaAdapter)
    monkeypatch.setattr(main, "RSSCrawler", EmptyCrawler)

    # Der Shadow-Block ist der EINZIGE Aufrufer — ein Aufruf hier bewiese, dass
    # der Guard nicht greift. Wir erwarten 0 Aufrufe für Pfad-B-Items.
    threshold_calls = []
    monkeypatch.setattr(main, "fetch_indicator_thresholds", lambda _id: threshold_calls.append(_id))

    inserted = []

    def fake_insert_draft(it, item_type):
        inserted.append((it, item_type))
        return "draft-id"

    monkeypatch.setattr(main, "insert_draft", fake_insert_draft)

    asyncio.run(main.run_ingestion())

    # Insert-/Live-Pfad unverändert, Nicht-Indikator-Typ.
    assert inserted == [(item, "lagebild_items")]

    # Kein Threshold-Lookup → Shadow-Block wurde übersprungen.
    assert threshold_calls == []

    # Kein plausibility_gate_shadow-JSON auf stdout.
    shadow_lines = []
    for line in capsys.readouterr().out.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        if obj.get("event") == "plausibility_gate_shadow":
            shadow_lines.append(obj)

    assert shadow_lines == []


def test_rss_items_use_article_evidence_before_llm(monkeypatch):
    """RSS ist nur Discovery: LLM bekommt Artikel-Evidence, nicht RSS-Rohobjekt."""
    raw = _lagebild_item()
    raw.raw_content = "RSS summary only"

    class FakeCrawler:
        def fetch_all(self):
            return [raw]

    class FakeArticleFetcher:
        def fetch_article_evidence(self, **kwargs):
            return SimpleNamespace(
                evidence_status="evidence_ready",
                excerpt="Artikel-Excerpt mit belegtem Fakt.",
                raw_text="Artikel-Body mit belegtem Fakt und zusätzlichem Kontext.",
                content_hash="abc123",
            )

    async def fake_extract(content, source_url, source_class):
        assert content == "Artikel-Body mit belegtem Fakt und zusätzlichem Kontext."
        return IngestionItem(
            title="Gaspreise belasten Haushalte",
            description="Hoehere Gaspreise koennen Heizkosten deutscher Haushalte erhoehen.",
            source_url=source_url,
            source_class=source_class,
            last_ingested_at=datetime.utcnow(),
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["energie"],
                time_to_impact="wochen",
                description="Direkte Wirkung auf deutsche Haushaltskosten.",
            ),
            methodology_tag="steep",
            affected_systems=["energie"],
            raw_content=content,
            status="extracted",
        )

    for attr in _ALL_ADAPTER_ATTRS:
        monkeypatch.setattr(main, attr, EmptyAdapter)
    monkeypatch.setattr(main, "RSSCrawler", FakeCrawler)
    monkeypatch.setattr(main, "ArticleFetcher", FakeArticleFetcher)
    monkeypatch.setattr(main, "extract_with_llm", fake_extract)

    inserted = []
    monkeypatch.setattr(main, "insert_draft", lambda item, item_type: inserted.append((item, item_type)) or "draft")

    asyncio.run(main.run_ingestion())

    assert len(inserted) == 1
    assert inserted[0][0].raw_content == "Artikel-Body mit belegtem Fakt und zusätzlichem Kontext."
    assert inserted[0][1] == "lagebild_items"


def test_rss_llm_items_without_wachsam_relevance_are_not_inserted(monkeypatch, capsys):
    raw = _lagebild_item()

    class FakeCrawler:
        def fetch_all(self):
            return [raw]

    class FakeArticleFetcher:
        def fetch_article_evidence(self, **kwargs):
            return SimpleNamespace(
                evidence_status="evidence_ready",
                excerpt="Kircheninterner Konflikt.",
                raw_text="Konflikt zwischen Piusbruedern und Papst wegen Bischofsweihe.",
                content_hash="abc123",
            )

    async def fake_extract(content, source_url, source_class):
        return IngestionItem(
            title="Konflikt zwischen Piusbruedern und dem Papst wegen Bischofsweihe",
            description="Kircheninterner Konflikt ohne erkennbare Wirkung auf Versorgung oder Haushaltskosten.",
            source_url=source_url,
            source_class=source_class,
            last_ingested_at=datetime.utcnow(),
            germany_relevance=GermanyRelevance(
                direct=False,
                systems_affected=["gesellschaft"],
                time_to_impact="wochen",
                description="Kein belastbarer Deutschland-Impact.",
            ),
            methodology_tag="steep",
            affected_systems=["gesellschaft"],
            raw_content=content,
            status="extracted",
        )

    for attr in _ALL_ADAPTER_ATTRS:
        monkeypatch.setattr(main, attr, EmptyAdapter)
    monkeypatch.setattr(main, "RSSCrawler", FakeCrawler)
    monkeypatch.setattr(main, "ArticleFetcher", FakeArticleFetcher)
    monkeypatch.setattr(main, "extract_with_llm", fake_extract)

    inserted = []
    monkeypatch.setattr(main, "insert_draft", lambda item, item_type: inserted.append((item, item_type)) or "draft")

    asyncio.run(main.run_ingestion())

    assert inserted == []
    gate_lines = []
    for line in capsys.readouterr().out.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        obj = json.loads(line)
        if obj.get("event") == "wachsam_relevance_gate":
            gate_lines.append(obj)

    assert len(gate_lines) == 1
    assert gate_lines[0]["action"] == "skip_draft"
    assert gate_lines[0]["reason"] == "low_relevance_topic"


def test_run_ingestion_persists_source_health_when_path_is_explicit(monkeypatch, tmp_path):
    item = _bnetza_item()

    class FakeBNetzAAdapter:
        name = "BNetzA"

        def __init__(self):
            self.source_errors = []

        def describe(self):
            return {
                "name": "BNetzA",
                "source": "GIE AGSI+",
                "requires_api_key": False,
                "writes_db": True,
                "output_target": "indicators",
            }

        def fetch_latest(self):
            return [item]

    for attr in _ALL_ADAPTER_ATTRS:
        if attr != "BNetzAAdapter":
            monkeypatch.setattr(main, attr, EmptyAdapter)
    monkeypatch.setattr(main, "BNetzAAdapter", FakeBNetzAAdapter)
    monkeypatch.setattr(main, "RSSCrawler", EmptyCrawler)
    monkeypatch.setattr(main, "insert_draft", lambda item, item_type: "draft")
    monkeypatch.setattr(main, "fetch_indicator_thresholds", lambda _id: None)
    health_path = tmp_path / "source-health.jsonl"
    monkeypatch.setenv("WACHSAM_SOURCE_HEALTH_PATH", str(health_path))

    asyncio.run(main.run_ingestion(dry_run=True, allow_fetch=True))

    records = [json.loads(line) for line in health_path.read_text(encoding="utf-8").splitlines()]
    bnetza_records = [record for record in records if record["source_id"] == "bnetza"]
    assert len(bnetza_records) == 1
    assert bnetza_records[0]["source_name"] == "BNetzA"
    assert bnetza_records[0]["target"] == "indicators"
    assert bnetza_records[0]["status"] == "ok"
    assert bnetza_records[0]["item_count"] == 1
    assert bnetza_records[0]["error_count"] == 0
    assert bnetza_records[0]["error_messages"] == []
    assert bnetza_records[0]["freshness_expectation"] == "daily"
    assert bnetza_records[0]["freshness_status"] == "stale"
    assert bnetza_records[0]["source_stand"] == "2026-05-27"


def test_run_ingestion_upserts_source_health_in_normal_mode(monkeypatch):
    item = _bnetza_item()

    class FakeBNetzAAdapter:
        name = "BNetzA"

        def __init__(self):
            self.source_errors = []

        def describe(self):
            return {
                "name": "BNetzA",
                "source": "GIE AGSI+",
                "requires_api_key": False,
                "writes_db": True,
                "output_target": "indicators",
            }

        def fetch_latest(self):
            return [item]

    for attr in _ALL_ADAPTER_ATTRS:
        if attr != "BNetzAAdapter":
            monkeypatch.setattr(main, attr, EmptyAdapter)
    monkeypatch.setattr(main, "BNetzAAdapter", FakeBNetzAAdapter)
    monkeypatch.setattr(main, "RSSCrawler", EmptyCrawler)
    monkeypatch.setattr(main, "insert_draft", lambda item, item_type: "draft")
    monkeypatch.setattr(main, "fetch_indicator_thresholds", lambda _id: None)

    captured = []
    monkeypatch.setattr(main, "upsert_source_health", lambda records: captured.extend(records) or len(records))

    asyncio.run(main.run_ingestion(dry_run=False, allow_fetch=True))

    # Reihenfolge: alle Adapter in Adapter-Listenreihenfolge; BNetzA an Position 2 (Index 1).
    # 14 Adapter gesamt in run_ingestion-Liste (13 bestehende + NINA), ohne deaktivierte.
    bnetza_record = next(r for r in captured if r.source_id == "bnetza")
    assert bnetza_record.status == "ok"
    assert bnetza_record.freshness_expectation == "daily"
    assert bnetza_record.freshness_status == "stale"
    assert len(captured) == 14  # 13 bestehende + NINA


# --- Task 5: DWD regionale Bundesland-Records persistieren -------------------

class FakeDWDAdapterWithRegionalRecords:
    name = "DWD"

    def __init__(self):
        self.source_errors = []
        self.regional_records = [
            {"region_code": "NRW", "warning_count": 2, "max_level": 3, "source": "dwd"}
        ]

    def describe(self):
        return {
            "name": "DWD",
            "source": "DWD WarnWetter warnings JSON",
            "requires_api_key": False,
            "writes_db": True,
            "output_target": "indicators",
        }

    def fetch_latest(self):
        return []


def _stub_all_adapters_except(monkeypatch, keep_attr, fake_cls):
    for attr in _ALL_ADAPTER_ATTRS:
        if attr != keep_attr:
            monkeypatch.setattr(main, attr, EmptyAdapter)
    monkeypatch.setattr(main, keep_attr, fake_cls)
    monkeypatch.setattr(main, "RSSCrawler", EmptyCrawler)
    monkeypatch.setattr(main, "insert_draft", lambda item, item_type: "draft")
    monkeypatch.setattr(main, "fetch_indicator_thresholds", lambda _id: None)
    monkeypatch.setattr(main, "upsert_source_health", lambda records: len(records))


def test_run_ingestion_persists_dwd_regional_records(monkeypatch):
    _stub_all_adapters_except(monkeypatch, "DWDAdapter", FakeDWDAdapterWithRegionalRecords)

    captured = []
    monkeypatch.setattr(
        main, "upsert_regional_warnings",
        lambda records: captured.extend(records) or len(records),
    )

    asyncio.run(main.run_ingestion(dry_run=False, allow_fetch=True))

    assert captured == [{"region_code": "NRW", "warning_count": 2, "max_level": 3, "source": "dwd"}]


def test_run_ingestion_regional_warnings_db_error_does_not_stop_run(monkeypatch, capsys):
    _stub_all_adapters_except(monkeypatch, "DWDAdapter", FakeDWDAdapterWithRegionalRecords)

    def boom(records):
        raise RuntimeError("db down")

    monkeypatch.setattr(main, "upsert_regional_warnings", boom)

    # Darf NICHT crashen — der Lauf muss trotz DB-Fehler durchlaufen.
    asyncio.run(main.run_ingestion(dry_run=False, allow_fetch=True))

    out = capsys.readouterr().out
    assert "abgeschlossen" in out


def test_run_ingestion_marks_bnetza_source_health_degraded_when_adapter_reports_source_error(monkeypatch):
    item = _bnetza_item(
        title="Gasspeicher Deutschland — Datenquelle prüfen",
        current_value=None,
        current_value_date=None,
        previous_value=None,
        previous_value_date=None,
        source_stand_date=None,
    )

    class FakeBNetzAAdapter:
        name = "BNetzA"

        def __init__(self):
            self.source_errors = [{
                "indicator_id": "wi-gasspeicher-fuellstand",
                "reason": "unexpected_payload_shape",
                "source_url": "https://agsi.gie.eu/",
                "keep_previous": True,
            }]

        def describe(self):
            return {
                "name": "BNetzA",
                "source": "GIE AGSI+",
                "requires_api_key": False,
                "writes_db": True,
                "output_target": "indicators",
            }

        def fetch_latest(self):
            return [item]

    for attr in _ALL_ADAPTER_ATTRS:
        if attr != "BNetzAAdapter":
            monkeypatch.setattr(main, attr, EmptyAdapter)
    monkeypatch.setattr(main, "BNetzAAdapter", FakeBNetzAAdapter)
    monkeypatch.setattr(main, "RSSCrawler", EmptyCrawler)
    monkeypatch.setattr(main, "insert_draft", lambda item, item_type: "draft")
    monkeypatch.setattr(main, "fetch_indicator_thresholds", lambda _id: None)

    captured = []
    monkeypatch.setattr(main, "upsert_source_health", lambda records: captured.extend(records) or len(records))

    asyncio.run(main.run_ingestion(dry_run=False, allow_fetch=True))

    bnetza_record = next(r for r in captured if r.source_id == "bnetza")
    assert bnetza_record.status == "degraded"
    assert bnetza_record.error_count == 1
    assert bnetza_record.error_messages == ["unexpected_payload_shape"]
    assert bnetza_record.freshness_status == "source-error"


# --- W6a.1: C4-Quellfehler-Sichtbarkeit im Ingestion-Fluss -------------------

def _collect_shadow_lines(capsys):
    out = []
    for line in capsys.readouterr().out.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        if obj.get("event") == "plausibility_gate_shadow":
            out.append(obj)
    return out


def _patch_other_adapters(monkeypatch, keep):
    """Alle Adapter außer `keep` auf EmptyAdapter setzen; Crawler/Threshold neutralisieren."""
    for attr in _ALL_ADAPTER_ATTRS:
        if attr != keep:
            monkeypatch.setattr(main, attr, EmptyAdapter)
    monkeypatch.setattr(main, "RSSCrawler", EmptyCrawler)
    monkeypatch.setattr(main, "fetch_indicator_thresholds", lambda _id: None)


def test_adapter_source_error_emits_single_c4_shadow_log(monkeypatch, capsys):
    """Ein Adapter-Quellfehler für einen bekannten Indikator erzeugt genau ein
    C4-Shadow-JSON — zusätzlich zum unveränderten Fallback-Item."""
    fallback = _lagebild_item()  # Fallback OHNE indicator_id (wie Destatis/FRED/EIA/FAO)

    class FakeFailingAdapter:
        name = "Destatis"

        def __init__(self):
            self.source_errors = []

        def fetch_latest(self):
            self.source_errors.append({
                "indicator_id": "wi-inflation-vpi-de",
                "reason": "HTTP 401",
                "source_url": "https://www.destatis.de/",
                "source_stand": None,
                "observed_at": None,
                "raw_value": None,
                "keep_previous": True,
            })
            return [fallback]

    monkeypatch.setattr(main, "DestatisAdapter", FakeFailingAdapter)
    _patch_other_adapters(monkeypatch, keep="DestatisAdapter")

    inserted = []
    monkeypatch.setattr(main, "insert_draft",
                        lambda it, t: inserted.append((it, t)) or "draft-id")

    asyncio.run(main.run_ingestion())

    # Produktiver Pfad unverändert: Fallback-Item wird als lagebild_items inserted.
    assert inserted == [(fallback, "lagebild_items")]

    logs = _collect_shadow_lines(capsys)
    assert len(logs) == 1
    log = logs[0]
    assert log["indicator_id"] == "wi-inflation-vpi-de"
    assert log["gate_class"] == "C4"
    assert log["would_action"] == "keep_previous_value"
    assert "HTTP 401" in log["reason"]
    assert log["raw_value"] is None
    assert log["parsed_value"] is None


def test_source_error_deduped_when_indicator_already_logged(monkeypatch, capsys):
    """Hat ein Item (auch Fallback) für die indicator_id bereits einen Shadow-Log
    erzeugt, darf der Quellfehler-Pfad KEINEN zweiten Log ausgeben (BNetzA-Schutz)."""
    item = _bnetza_item()  # trägt indicator_id wi-gasspeicher-fuellstand → Item-Shadow-Log

    class FakeDoubleAdapter:
        name = "BNetzA"

        def __init__(self):
            self.source_errors = []

        def fetch_latest(self):
            # Meldet zusätzlich einen Quellfehler für DENSELBEN Indikator.
            self.source_errors.append({
                "indicator_id": "wi-gasspeicher-fuellstand",
                "reason": "HTTP 500",
                "source_url": "https://agsi.gie.eu/",
                "source_stand": None, "observed_at": None,
                "raw_value": None, "keep_previous": True,
            })
            return [item]

    monkeypatch.setattr(main, "BNetzAAdapter", FakeDoubleAdapter)
    _patch_other_adapters(monkeypatch, keep="BNetzAAdapter")
    monkeypatch.setattr(main, "insert_draft", lambda it, t: "id")

    asyncio.run(main.run_ingestion())

    logs = _collect_shadow_lines(capsys)
    assert len(logs) == 1                       # genau ein Log, kein Doppel
    assert logs[0]["gate_class"] == "ok"        # der Item-Log gewinnt, kein C4


def test_source_error_without_indicator_id_emits_no_log(monkeypatch, capsys):
    """Quellfehler ohne zuordenbaren Indikator → kein Log, keine erfundene ID."""

    class FakeNoIndicatorAdapter:
        name = "Destatis"

        def __init__(self):
            self.source_errors = []

        def fetch_latest(self):
            self.source_errors.append({
                "indicator_id": None, "reason": "HTTP 503",
                "source_url": "https://x/", "source_stand": None,
                "observed_at": None, "raw_value": None, "keep_previous": True,
            })
            return []

    monkeypatch.setattr(main, "DestatisAdapter", FakeNoIndicatorAdapter)
    _patch_other_adapters(monkeypatch, keep="DestatisAdapter")
    monkeypatch.setattr(main, "insert_draft", lambda it, t: "id")

    asyncio.run(main.run_ingestion())

    assert _collect_shadow_lines(capsys) == []
