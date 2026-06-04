import asyncio
import json
from datetime import datetime

from src import main
from src.models import GermanyRelevance, IngestionItem


class EmptyAdapter:
    name = "Empty"

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
                 "TankerkoenigAdapter", "EurostatAdapter", "WarningIndicatorsAdapter"):
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
                 "TankerkoenigAdapter", "EurostatAdapter", "WarningIndicatorsAdapter"):
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
