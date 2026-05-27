from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from ..models import IngestionItem


class EditorialReview(BaseModel):
    reviewed_by: str = "editor"
    reviewed_at: datetime
    comments: Optional[str] = None
    status: str = "approved"  # approved, rejected, needs_revision


class EditorialQueue:
    """In-memory Editorial Queue — wird durch Postgres-Persistenz ersetzt."""

    def __init__(self):
        self.queue: List[IngestionItem] = []
        self.processed: List[IngestionItem] = []

    def add_item(self, item: IngestionItem) -> IngestionItem:
        item.status = "in_review"
        self.queue.append(item)
        print(f"[QUEUE] Neues Item: {item.title}")
        return item

    def get_pending(self) -> List[IngestionItem]:
        return [item for item in self.queue if item.status == "in_review"]

    def approve(self, item_id: str, comments: Optional[str] = None) -> Optional[IngestionItem]:
        for item in self.queue:
            if item.id == item_id:
                item.editorial_reviewed_at = datetime.now()
                item.status = "published"
                item.published_at = datetime.now()
                self.processed.append(item)
                self.queue.remove(item)
                print(f"[QUEUE] Genehmigt: {item.title}")
                return item
        return None

    def reject(self, item_id: str, comments: Optional[str] = None) -> Optional[IngestionItem]:
        for item in self.queue:
            if item.id == item_id:
                item.editorial_reviewed_at = datetime.now()
                item.status = "raw"
                print(f"[QUEUE] Abgelehnt: {item.title}")
                return item
        return None
