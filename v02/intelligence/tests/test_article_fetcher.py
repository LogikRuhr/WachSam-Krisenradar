from unittest.mock import MagicMock

import requests

import src.fetchers.article_fetcher as article_module
from src.fetchers.article_fetcher import ArticleFetcher


HTML = """
<html>
  <head>
    <title>Seitentitel</title>
    <style>.hidden { display: none; }</style>
    <script>window.bad = true;</script>
  </head>
  <body>
    <nav>Navigation ignorieren</nav>
    <article>
      <h1>Artikelüberschrift</h1>
      <p>Erster belegbarer Absatz mit relevanten Informationen.</p>
      <p>Zweiter Absatz mit zusätzlichem Kontext für WachSam.</p>
    </article>
  </body>
</html>
"""


def _response(status_code=200, text=HTML):
    response = MagicMock()
    response.status_code = status_code
    response.text = text
    response.url = "https://example.com/article"
    if status_code >= 400:
        response.raise_for_status.side_effect = requests.HTTPError(f"HTTP {status_code}")
    else:
        response.raise_for_status.return_value = None
    return response


def test_fetch_article_evidence_extracts_readable_text(monkeypatch):
    monkeypatch.setattr(article_module.requests, "get", lambda *args, **kwargs: _response())

    evidence = ArticleFetcher(timeout_seconds=10).fetch_article_evidence(
        source_id="rss-tagesschau",
        source_name="Tagesschau",
        source_url="https://example.com/article",
        published_at="2026-06-09T10:00:00Z",
    )

    assert evidence.fetch_status == "fetched"
    assert evidence.evidence_status == "evidence_ready"
    assert evidence.published_at == "2026-06-09T10:00:00Z"
    assert "Artikelüberschrift" in evidence.raw_text
    assert "Erster belegbarer Absatz" in evidence.excerpt
    assert "window.bad" not in evidence.raw_text
    assert "display: none" not in evidence.raw_text
    assert evidence.extraction_method == "article_fetcher"


def test_fetch_article_evidence_records_http_failure(monkeypatch):
    monkeypatch.setattr(article_module.requests, "get", lambda *args, **kwargs: _response(status_code=503))

    evidence = ArticleFetcher(timeout_seconds=10).fetch_article_evidence(
        source_id="rss-tagesschau",
        source_name="Tagesschau",
        source_url="https://example.com/article",
    )

    assert evidence.fetch_status == "fetch_failed"
    assert evidence.evidence_status == "no_evidence"
    assert evidence.excerpt == ""
    assert "HTTP 503" in evidence.failure_reason


def test_fetch_article_evidence_records_timeout(monkeypatch):
    def raise_timeout(*args, **kwargs):
        raise requests.Timeout("too slow")

    monkeypatch.setattr(article_module.requests, "get", raise_timeout)

    evidence = ArticleFetcher(timeout_seconds=10).fetch_article_evidence(
        source_id="rss-tagesschau",
        source_name="Tagesschau",
        source_url="https://example.com/article",
    )

    assert evidence.fetch_status == "fetch_failed"
    assert evidence.evidence_status == "no_evidence"
    assert "too slow" in evidence.failure_reason
