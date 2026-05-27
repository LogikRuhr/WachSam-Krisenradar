import asyncio
import os
import signal
import sys
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .adapters.destatis import DestatisAdapter
from .adapters.bnetza import BNetzAAdapter
from .adapters.fao import FAOAdapter
from .adapters.eurostat import EurostatAdapter
from .adapters.warning_indicators import WarningIndicatorsAdapter
from .crawler.rss_crawler import RSSCrawler
from .extractors.llm_extractor import extract_with_llm
from .db import insert_draft


ADAPTER_TYPE_MAP = {
    "Destatis": "facts",
    "BNetzA": "lagebild_items",
    "FAO": "facts",
    "Eurostat": "facts",
    "WarningIndicators": "facts",
}


async def run_ingestion():
    print(f"=== WachSam Ingestion gestartet um {datetime.utcnow()} ===\n")

    adapters = [
        DestatisAdapter(),
        BNetzAAdapter(),
        FAOAdapter(),
        EurostatAdapter(),
        WarningIndicatorsAdapter(),
    ]

    items = []
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

    print(f"\n{len(items)} Items total.")

    saved = 0
    for item in items:
        item_type = ADAPTER_TYPE_MAP.get(item.source_class, "lagebild_items")
        if item.source_class in ("behoerde", "wirtschaftsinstitut", "qualitaetsmedien"):
            item_type = "lagebild_items"
        draft_id = insert_draft(item, item_type)
        if draft_id:
            saved += 1

    print(f"{saved}/{len(items)} Drafts in DB gespeichert.")
    print(f"\n=== Ingestion abgeschlossen um {datetime.utcnow()} ===")


def run_scheduled():
    """Wrapper für APScheduler — startet async run_ingestion."""
    asyncio.get_event_loop().run_until_complete(run_ingestion())


def main():
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
