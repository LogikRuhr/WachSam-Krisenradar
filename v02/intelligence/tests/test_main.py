import asyncio
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

    monkeypatch.setattr(main, "DestatisAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "BNetzAAdapter", FakeBNetzAAdapter)
    monkeypatch.setattr(main, "EIAAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "FREDAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "FAOAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "TankerkoenigAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "PegelonlineAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "DWDAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "EurostatAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "WarningIndicatorsAdapter", EmptyAdapter)
    monkeypatch.setattr(main, "RSSCrawler", EmptyCrawler)

    inserted = []

    def fake_insert_draft(item, item_type):
        inserted.append((item, item_type))
        return item.indicator_id or "draft-id"

    monkeypatch.setattr(main, "insert_draft", fake_insert_draft)

    asyncio.run(main.run_ingestion())

    assert inserted == [(bnetza_item, "indicators")]


def _bnetza_item():
    return IngestionItem(
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


def test_shadow_logs_json_and_does_not_alter_insert_path(monkeypatch, capsys):
    """W6a: Shadow-Gate loggt strukturiertes JSON, lässt den Insert-Pfad unverändert."""
    item = _bnetza_item()

    class FakeBNetzAAdapter:
        name = "BNetzA"

        def fetch_latest(self):
            return [item]

    for attr in ("DestatisAdapter", "EIAAdapter", "FREDAdapter", "FAOAdapter",
                 "TankerkoenigAdapter", "PegelonlineAdapter", "DWDAdapter", "EurostatAdapter", "WarningIndicatorsAdapter"):
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

    for attr in ("BNetzAAdapter", "EIAAdapter", "FREDAdapter", "FAOAdapter",
                 "TankerkoenigAdapter", "PegelonlineAdapter", "DWDAdapter", "EurostatAdapter", "WarningIndicatorsAdapter"):
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
            title="Extrahierter Evidence-Draft",
            description="Aus Artikel-Evidence extrahiert.",
            source_url=source_url,
            source_class=source_class,
            last_ingested_at=datetime.utcnow(),
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["gesellschaft"],
                time_to_impact="wochen",
                description="Evidence-basierte Einordnung.",
            ),
            methodology_tag="steep",
            affected_systems=["gesellschaft"],
            raw_content=content,
            status="extracted",
        )

    for attr in ("DestatisAdapter", "BNetzAAdapter", "EIAAdapter", "FREDAdapter",
                 "FAOAdapter", "TankerkoenigAdapter", "PegelonlineAdapter", "DWDAdapter", "EurostatAdapter", "WarningIndicatorsAdapter"):
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

    for attr in ("DestatisAdapter", "EIAAdapter", "FREDAdapter", "FAOAdapter",
                 "TankerkoenigAdapter", "PegelonlineAdapter", "DWDAdapter", "EurostatAdapter", "WarningIndicatorsAdapter"):
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
    assert bnetza_records == [
        {
            "source_id": "bnetza",
            "source_name": "BNetzA",
            "target": "indicators",
            "status": "ok",
            "last_checked_at": bnetza_records[0]["last_checked_at"],
            "last_success_at": bnetza_records[0]["last_success_at"],
            "item_count": 1,
            "error_count": 0,
            "error_messages": [],
        }
    ]


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
    for attr in ("DestatisAdapter", "BNetzAAdapter", "EIAAdapter", "FREDAdapter",
                 "FAOAdapter", "TankerkoenigAdapter", "PegelonlineAdapter", "DWDAdapter", "EurostatAdapter",
                 "WarningIndicatorsAdapter"):
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
