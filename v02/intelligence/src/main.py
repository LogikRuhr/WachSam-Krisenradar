import argparse
import asyncio
import json
import os
import signal
import sys
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .adapters.destatis import DestatisAdapter
from .adapters.bnetza import BNetzAAdapter
from .adapters.eia import EIAAdapter
from .adapters.fred import FREDAdapter
from .adapters.fao import FAOAdapter
from .adapters.tankerkoenig import TankerkoenigAdapter
# Imports bleiben erhalten (Tests + spätere Reaktivierung), Adapter laufen aber
# nicht aktiv (siehe run_ingestion / docs/intelligence/source-inventory.md):
from .adapters.eurostat import EurostatAdapter
from .adapters.warning_indicators import WarningIndicatorsAdapter
from .crawler.rss_crawler import RSSCrawler
from .extractors.llm_extractor import extract_with_llm
from .db import insert_draft, set_dry_run, fetch_indicator_thresholds
from .validation import validate_draft
from .gate import evaluate_plausibility, build_shadow_log
from .plausibility_rules import get_rules


ADAPTER_TYPE_MAP = {
    "Destatis": "facts",
    "BNetzA": "indicators",
    "EIA": "indicators",
    "FRED": "indicators",
    "FAO": "facts",
    "Eurostat": "facts",
    "WarningIndicators": "facts",
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
        # Deaktiviert (Entscheidung 2026-06-03, siehe source-inventory.md):
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
    if allow_fetch:
        for adapter in adapters:
            try:
                result = adapter.fetch_latest()
                items.extend(result)
                print(f"  [{adapter.name}] {len(result)} Items")
            except Exception as e:
                print(f"  [{adapter.name}] FEHLER: {e}")

        crawler = RSSCrawler()
        try:
            raw_items = crawler.fetch_all()
            for raw in raw_items[:5]:
                extracted = await extract_with_llm(
                    raw.raw_content or raw.description,
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

        # --- W6a Plausibilitäts-Gate (SHADOW / Log-only) ----------------------
        # Bewertet nur, was das Gate TUN würde, und loggt strukturiertes JSON.
        # KEIN Eingriff in den Live-/DB-Pfad: kein Block, kein Stale-on-error,
        # kein current_value-Overwrite, kein Write. Nur Indikator-Pfad.
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

        draft_id = insert_draft(item, item_type)
        if draft_id:
            saved += 1

    if invalid:
        print(f"⚠ {invalid}/{len(items)} Items mit Kanon-Fehlern (nicht blockiert, Review im Editorial-Gate).")

    label = "geplant (Dry-Run, kein Write)" if dry_run else "in DB gespeichert"
    print(f"{saved}/{len(items)} Drafts {label}.")
    print(f"\n=== Ingestion abgeschlossen um {datetime.utcnow()} ===")


def run_scheduled():
    """Wrapper für APScheduler — startet async run_ingestion."""
    asyncio.get_event_loop().run_until_complete(run_ingestion())


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
        scheduler = AsyncIOScheduler()
        scheduler.add_job(run_scheduled, "cron", hour=6, minute=0, id="morning")
        scheduler.add_job(run_scheduled, "cron", hour=18, minute=0, id="evening")
        scheduler.start()
        print("Scheduler gestartet: 06:00 + 18:00 UTC")
        print("Drücke Ctrl+C zum Beenden.\n")

        loop = asyncio.new_event_loop()
        try:
            loop.run_forever()
        except (KeyboardInterrupt, SystemExit):
            scheduler.shutdown()
            print("Scheduler beendet.")
    else:
        asyncio.run(run_ingestion())


if __name__ == "__main__":
    main()
