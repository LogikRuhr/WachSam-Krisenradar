from __future__ import annotations

import logging
import re
from html.parser import HTMLParser

import requests

from ..evidence import EvidenceRecord


logger = logging.getLogger(__name__)


class _ReadableTextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self._skip_depth = 0
        self._parts: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() in {"script", "style", "noscript"}:
            self._skip_depth += 1

    def handle_endtag(self, tag):
        if tag.lower() in {"script", "style", "noscript"} and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data):
        if self._skip_depth:
            return
        stripped = data.strip()
        if stripped:
            self._parts.append(stripped)

    def text(self) -> str:
        return re.sub(r"\s+", " ", " ".join(self._parts)).strip()


class ArticleFetcher:
    """Fetches article pages into evidence records.

    This is intentionally conservative: no paywall/login bypass, no browser
    automation, no hidden-source scraping. RSS remains discovery; this fetcher
    only records whether article evidence could be obtained.
    """

    def __init__(self, timeout_seconds: int = 15):
        self.timeout_seconds = timeout_seconds

    def fetch_article_evidence(
        self,
        *,
        source_id: str,
        source_name: str,
        source_url: str,
        published_at: str | None = None,
    ) -> EvidenceRecord:
        try:
            response = requests.get(
                source_url,
                headers={"User-Agent": "WachSam-Krisenradar/0.3 (+https://wachsam.ruhrlogik.de)"},
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            raw_text = self._extract_text(response.text)
            excerpt = raw_text[:500]
            evidence_status = "evidence_ready" if excerpt else "no_evidence"
            return EvidenceRecord(
                source_id=source_id,
                source_name=source_name,
                source_url=getattr(response, "url", source_url) or source_url,
                published_at=published_at,
                excerpt=excerpt,
                raw_text=raw_text,
                fetch_status="fetched",
                evidence_status=evidence_status,
                extraction_method="article_fetcher",
            )
        except requests.RequestException as e:
            logger.warning("Article fetch failed: %s — %s", source_url, e)
            return EvidenceRecord(
                source_id=source_id,
                source_name=source_name,
                source_url=source_url,
                published_at=published_at,
                fetch_status="fetch_failed",
                evidence_status="no_evidence",
                extraction_method="article_fetcher",
                failure_reason=str(e),
            )

    @staticmethod
    def _extract_text(html: str) -> str:
        parser = _ReadableTextParser()
        parser.feed(html)
        return parser.text()
