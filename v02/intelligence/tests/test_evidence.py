from src.evidence import EvidenceRecord


def test_evidence_record_generates_stable_content_hash():
    first = EvidenceRecord(
        source_id="rss-tagesschau",
        source_name="Tagesschau",
        source_url="https://example.com/article",
        excerpt="Belegter Artikel-Auszug mit Faktenkern.",
        raw_text="Belegter Artikel-Auszug mit Faktenkern. Weitere Sätze.",
        fetch_status="fetched",
        evidence_status="evidence_ready",
        extraction_method="article_fetcher",
    )
    second = EvidenceRecord(
        source_id="rss-tagesschau",
        source_name="Tagesschau",
        source_url="https://example.com/article",
        excerpt="Belegter Artikel-Auszug mit Faktenkern.",
        raw_text="Belegter Artikel-Auszug mit Faktenkern. Weitere Sätze.",
        fetch_status="fetched",
        evidence_status="evidence_ready",
        extraction_method="article_fetcher",
    )

    assert first.content_hash == second.content_hash
    assert len(first.content_hash) == 64


def test_evidence_record_content_hash_changes_with_excerpt():
    first = EvidenceRecord(
        source_id="rss-tagesschau",
        source_name="Tagesschau",
        source_url="https://example.com/article",
        excerpt="Erster Auszug.",
        fetch_status="fetched",
        evidence_status="evidence_ready",
        extraction_method="article_fetcher",
    )
    second = EvidenceRecord(
        source_id="rss-tagesschau",
        source_name="Tagesschau",
        source_url="https://example.com/article",
        excerpt="Anderer Auszug.",
        fetch_status="fetched",
        evidence_status="evidence_ready",
        extraction_method="article_fetcher",
    )

    assert first.content_hash != second.content_hash


def test_failed_evidence_can_be_represented_without_excerpt():
    evidence = EvidenceRecord(
        source_id="rss-tagesschau",
        source_name="Tagesschau",
        source_url="https://example.com/article",
        fetch_status="fetch_failed",
        evidence_status="no_evidence",
        extraction_method="article_fetcher",
        failure_reason="HTTP 503",
    )

    assert evidence.excerpt == ""
    assert evidence.failure_reason == "HTTP 503"
    assert len(evidence.content_hash) == 64
