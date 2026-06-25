import argparse
import asyncio
import json
import os
import signal
import sys
from datetime import datetime
from types import SimpleNamespace

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .adapters.destatis import DestatisAdapter
from .adapters.bnetza import BNetzAAdapter
from .adapters.eia import EIAAdapter
from .adapters.fred import FREDAdapter
from .adapters.fao import FAOAdapter
from .adapters.tankerkoenig import TankerkoenigAdapter
from .adapters.pegelonline import PegelonlineAdapter
from .adapters.dwd import DWDAdapter
from .adapters.bip import BIPAdapter
from .adapters.arbeitslosigkeit import ArbeitslosigkeitAdapter
from .adapters.ezbleitzins import EZBLeitzinsAdapter
from .adapters.staatsschulden import StaatsschuldenAdapter
from .adapters.insolvenzen import InsolvenzenAdapter
# Imports bleiben erhalten
# nicht aktiv (siehe run_ingestion / docs/intelligence/source-inventory.md):
from .adapters.eurostat import EurostatAdapter
from .adapters.warning_indicators import WarningIndicatorsAdapter
from .crawler.rss_crawler import RSSCrawler
from .fetchers.article_fetcher import ArticleFetcher
from .extractors.llm_extractor import extract_with_llm, reset_llm_runtime_state
from .db import insert_draft, set_dry_run, fetch_indicator_thresholds, upsert_source_health
from .validation import validate_draft
from .gate import evaluate_plausibility, source_error_verdict, build_shadow_log
from .plausibility_rules import get_rules
from .source_health import build_source_health, persist_source_health
from .freshness import classify_freshness, load_registry_index, source_stand_from_items


ADAPTER_TYPE_MAP = {
    "Destatis": "facts",
    "BNetzA": "indicators",
    "EIA": "indicators",
    "FRED": "indicators",
    "FAO": "facts",
    "Pegelonline": "indicators",
    "DWD": "indicators",
    "Eurostat": "facts",
    "WarningIndicators": "facts",
    "BIP": "indicators",
    "Arbeitslosigkeit": "indicators",
    "EZBLeitzins": "indicators",
    "Staatsschulden": "indicators",
    "Insolvenzen": "indicators",
}


def resolve_item_type(item):
    if item.indicator_id:
        return "indicators"

    item_type = ADAPTER_TYPE_MAP.get(item.source_class, "lagebild_items")
    if item.source_class in ("behoerde", "wirtschaftsinstitut", "qualitaetsmedien"):
        return "lagebild_items"
    return item_type


async def run_ingestion(dry_run: bool = False, allow_fetch=None):
    """Hauptlauf der Ingestion.

    dry_run=True  → keine DB-Writes (set_dry_run aktiv); externe API-Calls
                    werden standardmäßig übersprungen.
    allow_fetch   → None: leitet sich aus dry_run ab (Normalbetrieb fetcht,
                    Dry-Run nicht). True erzwingt read-only Live-Calls OHNE
                    DB-Write (zum Inspizieren echter Daten).
    """
    if allow_fetch is None:
        allow_fetch = not dry_run

    # Flag deterministisch am Lauf-Anfang setzen, damit kein Zustand hängen bleibt.
    set_dry_run(dry_run)
    reset_llm_runtime_state()

    if dry_run:
        print("=== DRY-RUN: keine DB-Writes, keine Migrationen ===")
        print(f"    externe API-Calls: {'JA (read-only)' if allow_fetch else 'NEIN (nur Plan)'}\n")

    print(f"=== WachSam Ingestion gestartet um {datetime.utcnow()} ===\n")

    adapters = [
        DestatisAdapter(),
        BNetzAAdapter(),
        EIAAdapter(),
        FREDAdapter(),
        FAOAdapter(),
        TankerkoenigAdapter(),
        PegelonlineAdapter(),
        DWDAdapter(),
        BIPAdapter(),
        ArbeitslosigkeitAdapter(),
        EZBLeitzinsAdapter(),
        StaatsschuldenAdapter(),
        InsolvenzenAdapter(),
        # Deaktiviert
        #   EurostatAdapter()          — Stub, parst Response nicht
        #   WarningIndicatorsAdapter() — redundant zu EIAAdapter (Brent)
    ]

    if dry_run:
        print("Adapter-Plan:")
        for adapter in adapters:
            d = adapter.describe()
            key = "API-Key nötig" if d["requires_api_key"] else "kein Key"
            print(
                f"  - {d['name']}: {d['source']} | {key} | "
                f"schreibt DB: {'ja' if d['writes_db'] else 'nein'} | Ziel: {d['output_target']}"
            )
        print()

    items = []
    source_errors = []
    source_health_records = []
    registry_index = load_registry_index()
    if allow_fetch:
        for adapter in adapters:
            result = []
            adapter_errors = []
            try:
                result = adapter.fetch_latest()
                items.extend(result)
                print(f"  [{adapter.name}] {len(result)} Items")
            except Exception as e:
                adapter_errors.append({"reason": str(e)})
                print(f"  [{adapter.name}] FEHLER: {e}")
            # W6a.1: gemeldete Quell-/Fetch-/Parsingfehler einsammeln (rein
            # additiv; getattr-defensiv für Adapter/Fakes ohne das Attribut).
            adapter_errors.extend(getattr(adapter, "source_errors", []))
            source_errors.extend(adapter_errors)
            registry_source = registry_index.by_adapter_name.get(adapter.name)
            source_stand = source_stand_from_items(result)
            if not source_stand:
                source_stand = next((err.get("source_stand") for err in adapter_errors if err.get("source_stand")), None)
            freshness = classify_freshness(
                freshness_expectation=registry_source.freshness_expectation if registry_source else "unknown",
                source_stand=source_stand,
                has_source_error=bool(adapter_errors),
            )
            source_health_records.append(
                build_source_health(
                    adapter,
                    item_count=len(result),
                    source_errors=adapter_errors,
                    freshness_status=freshness.status,
                    freshness_expectation=freshness.expectation,
                    source_stand=freshness.source_stand,
                    freshness_reason=freshness.reason,
                )
            )

        health_path = os.environ.get("WACHSAM_SOURCE_HEALTH_PATH")
        if health_path:
            persist_source_health(source_health_records, health_path)
            print(f"  [SOURCE_HEALTH] {len(source_health_records)} Records persistiert: {health_path}")
        written_health_records = upsert_source_health(source_health_records)
        if written_health_records:
            print(f"  [SOURCE_HEALTH] {written_health_records} Records in DB upserted")

        crawler = RSSCrawler()
        article_fetcher = ArticleFetcher()
        try:
            raw_items = crawler.fetch_all()
            for raw in raw_items[:5]:
                evidence = article_fetcher.fetch_article_evidence(
                    source_id=raw.source_url,
                    source_name=raw.source_class,
                    source_url=raw.source_url,
                    published_at=raw.published_at.isoformat() if raw.published_at else None,
                )
                if evidence.evidence_status != "evidence_ready":
                    print(f"  [RSS] Evidence fehlt: {raw.source_url}")
                    continue

                evidence_text = evidence.raw_text or evidence.excerpt
                extracted = await extract_with_llm(
                    evidence_text,
                    raw.source_url,
                    raw.source_class,
                )
                if extracted:
                    items.append(extracted)
                    print(f"  [LLM] Extrahiert: {extracted.title}")
        except Exception as e:
            print(f"  [RSS/LLM] FEHLER: {e}")
    else:
        print("  (externe Calls übersprungen — --allow-fetch für read-only Live-Plan)")

    print(f"\n{len(items)} Items total.")

    saved = 0
    invalid = 0
    shadow_logged_ids = set()
    for item in items:
        item_type = resolve_item_type(item)

        # Kanon-Validierung — nur protokollieren, NICHT blockieren. Invalide Drafts
        # werden nicht auto-published; das Editorial-Gate entscheidet später.
        result = validate_draft(item)
        if result.errors:
            invalid += 1
            print(f"  [VALIDIERUNG] '{item.title}': {len(result.errors)} Fehler — {result.errors}")
        if result.warnings:
            print(f"  [VALIDIERUNG] '{item.title}': {len(result.warnings)} Hinweise — {result.warnings}")

        # --- Plausibilitäts-Gate / Stale-on-error -----------------------------
        # C1/C4 halten den letzten guten Wert: kein Indicator-UPDATE und kein
        # Observation-Append für kaputte/unmögliche Messwerte. C2/C3 bleiben
        # sichtbar, aber mit Review-Log.
        skip_write = False
        if item_type == "indicators" and item.indicator_id:
            thresholds = fetch_indicator_thresholds(item.indicator_id)
            verdict = evaluate_plausibility(
                indicator_id=item.indicator_id,
                raw_value=item.current_value,
                previous_value=item.previous_value,
                rules=get_rules(item.indicator_id),
                thresholds=thresholds,
                scale_direction=(thresholds or {}).get("scale_direction", "higher_is_worse"),
            )
            print(json.dumps(build_shadow_log(item, verdict), ensure_ascii=False))
            shadow_logged_ids.add(item.indicator_id)
            skip_write = verdict.would_action in ("keep_previous_value", "parsing_error")

        if skip_write:
            print(f"  [STALE] '{item.title}': letzter gültiger Wert bleibt erhalten")
            continue

        draft_id = insert_draft(item, item_type)
        if draft_id:
            saved += 1

    # --- W6a.1 C4-Quellfehler-Sichtbarkeit (SHADOW / Log-only) ----------------
    # Für bekannte Indikatoren, deren Adapter einen Quell-/Fetch-/Parsingfehler
    # gemeldet hat und die KEIN Item (auch kein Fallback) durch den Shadow-Block
    # geschickt haben, zusätzlich ein C4-Shadow-Log. KEIN Eingriff in den Live-/
    # DB-Pfad: kein Block, kein Stale, kein current_value-Halten, kein Write.
    # Dedup über shadow_logged_ids verhindert Doppel-Logs (z.B. BNetzA-Fallback).
    for err in source_errors:
        ind = err.get("indicator_id")
        if not ind or ind in shadow_logged_ids:
            continue
        verdict = source_error_verdict(
            ind,
            err.get("reason", "Quellenfehler"),
            raw_value=err.get("raw_value"),
            keep_previous=err.get("keep_previous", True),
        )
        shadow_logged_ids.add(ind)
        # build_shadow_log ist duck-typed (liest Attribute via getattr) — ein
        # leichtes Shim trägt die Quell-Metadaten aus dem Fehler-Eintrag.
        shim = SimpleNamespace(
            source_url=err.get("source_url"),
            source_stand_label=err.get("source_stand"),
            source_stand_date=None,
            current_value_date=err.get("observed_at"),
        )
        print(json.dumps(build_shadow_log(shim, verdict), ensure_ascii=False))

    if invalid:
        print(f"WARNUNG: {invalid}/{len(items)} Items mit Kanon-Fehlern (nicht blockiert, Review im Editorial-Gate).")

    label = "geplant (Dry-Run, kein Write)" if dry_run else "in DB gespeichert"
    print(f"{saved}/{len(items)} Drafts {label}.")
    print(f"\n=== Ingestion abgeschlossen um {datetime.utcnow()} ===")


async def run_scheduled():
    """APScheduler job: fuehrt einen Ingestion-Lauf im aktiven Event Loop aus."""
    await run_ingestion()


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="WachSam Ingestion")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Kein DB-Write, keine Migrationen; zeigt nur Plan/Log.",
    )
    parser.add_argument(
        "--allow-fetch",
        action="store_true",
        help="Im Dry-Run echte, read-only API-Calls erlauben (weiterhin kein DB-Write).",
    )
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)

    if args.dry_run:
        asyncio.run(run_ingestion(dry_run=True, allow_fetch=args.allow_fetch))
        return

    mode = os.environ.get("INGESTION_MODE", "once")

    if mode == "scheduled":
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        scheduler = AsyncIOScheduler(event_loop=loop)
        scheduler.add_job(run_scheduled, "cron", hour=6, minute=0, id="morning")
        scheduler.add_job(run_scheduled, "cron", hour=18, minute=0, id="evening")
        scheduler.start()
        print("Scheduler gestartet: 06:00 + 18:00 UTC")
        print("Drücke Ctrl+C zum Beenden.\n")

        try:
            loop.run_forever()
        except (KeyboardInterrupt, SystemExit):
            print("Scheduler beendet.")
        finally:
            scheduler.shutdown()
            loop.close()
    else:
        asyncio.run(run_ingestion())


if __name__ == "__main__":
    main()
