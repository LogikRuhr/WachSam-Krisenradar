from types import SimpleNamespace

import feedparser
import pytest

import src.crawler.rss_crawler as rss_module
from src.crawler.rss_crawler import RSSCrawler


def test_fetch_feed_sets_timeout_and_maps_entries(monkeypatch):
    timeout_calls = []
    monkeypatch.setattr(
        rss_module,
        "socket",
        SimpleNamespace(setdefaulttimeout=lambda seconds: timeout_calls.append(seconds)),
        raising=False,
    )

    entry = feedparser.FeedParserDict(
        {
            "title": "Warnlage aktualisiert",
            "summary": "Kurze RSS-Zusammenfassung",
            "link": "https://example.com/warnlage",
        }
    )
    monkeypatch.setattr(
        rss_module.feedparser,
        "parse",
        lambda url: SimpleNamespace(entries=[entry]),
    )

    items = RSSCrawler(timeout_seconds=10).fetch_feed(
        {"name": "Example", "url": "https://example.com/rss"}
    )

    assert timeout_calls == [10]
    assert len(items) == 1
    assert items[0].title == "Warnlage aktualisiert"
    assert items[0].source_url == "https://example.com/warnlage"
    assert items[0].status == "raw"


def test_fetch_all_logs_feed_failure_and_continues(monkeypatch, caplog):
    crawler = RSSCrawler(timeout_seconds=10)
    crawler.sources = [
        {"name": "Broken", "url": "https://example.com/broken.xml"},
        {"name": "Empty", "url": "https://example.com/empty.xml"},
    ]

    def fake_fetch(source):
        if source["name"] == "Broken":
            raise TimeoutError("feed timeout")
        return []

    monkeypatch.setattr(crawler, "fetch_feed", fake_fetch)

    with caplog.at_level("WARNING"):
        items = crawler.fetch_all()

    assert items == []
    assert "RSS feed failed" in caplog.text
    assert "Broken" in caplog.text
    assert "feed timeout" in caplog.text
