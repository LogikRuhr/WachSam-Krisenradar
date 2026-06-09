from datetime import datetime
import logging
import socket
from typing import List, Dict

import feedparser

from ..models import IngestionItem, GermanyRelevance


logger = logging.getLogger(__name__)


class RSSCrawler:
    """RSS Crawler für Nachrichtenquellen (Tagesschau, Handelsblatt etc.)."""

    def __init__(self, timeout_seconds: int = 10):
        self.timeout_seconds = timeout_seconds
        self.sources = [
            {"name": "Tagesschau", "url": "https://www.tagesschau.de/xml/rss2/"},
            {"name": "Handelsblatt", "url": "https://www.handelsblatt.com/rss/"},
        ]

    def fetch_feed(self, source: Dict) -> List[IngestionItem]:
        socket.setdefaulttimeout(self.timeout_seconds)
        feed = feedparser.parse(source["url"])
        items = []

        for entry in feed.entries[:10]:
            item = IngestionItem(
                title=entry.title,
                description=entry.get("summary", ""),
                source_url=entry.link,
                source_class="qualitaetsmedien",
                last_ingested_at=datetime.now(),
                germany_relevance=GermanyRelevance(
                    direct=False,
                    systems_affected=[],
                    time_to_impact="wochen",
                    description="Automatisch erkannt — LLM-Extraktion und redaktionelle Prüfung erforderlich.",
                ),
                methodology_tag="steep",
                affected_systems=[],
                raw_content=str(entry),
                status="raw",
            )
            items.append(item)

        return items

    def fetch_all(self) -> List[IngestionItem]:
        items = []
        for source in self.sources:
            try:
                result = self.fetch_feed(source)
                items.extend(result)
                logger.info("RSS feed fetched", extra={"source": source["name"], "items": len(result)})
                print(f"[RSS] {source['name']}: {len(result)} Items")
            except Exception as e:
                logger.warning("RSS feed failed: %s — %s", source["name"], e)
                print(f"[RSS] {source['name']} FEHLER: {e}")
        return items
