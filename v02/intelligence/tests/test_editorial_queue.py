import pytest
from src.queue.editorial_queue import EditorialQueue


def test_add_item_sets_in_review(sample_item):
    queue = EditorialQueue()
    queue.add_item(sample_item)
    assert sample_item.status == "in_review"
    assert len(queue.queue) == 1


def test_get_pending(sample_item):
    queue = EditorialQueue()
    queue.add_item(sample_item)
    pending = queue.get_pending()
    assert len(pending) == 1


def test_approve_sets_published(sample_item):
    sample_item.id = "test-123"
    queue = EditorialQueue()
    queue.add_item(sample_item)

    result = queue.approve("test-123")
    assert result is not None
    assert result.status == "published"
    assert result.published_at is not None
    assert len(queue.queue) == 0
    assert len(queue.processed) == 1


def test_reject_resets_status(sample_item):
    sample_item.id = "test-456"
    queue = EditorialQueue()
    queue.add_item(sample_item)

    result = queue.reject("test-456")
    assert result is not None
    assert result.status == "raw"


def test_approve_unknown_id(sample_item):
    queue = EditorialQueue()
    queue.add_item(sample_item)
    result = queue.approve("nonexistent")
    assert result is None
