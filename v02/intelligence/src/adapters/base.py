from abc import ABC, abstractmethod
from datetime import datetime
from typing import List

from ..models import IngestionItem


class BaseAdapter(ABC):
    """Abstrakte Basisklasse für alle strukturierten Adapter."""

    source_class: str = "behoerde"

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def fetch_latest(self) -> List[IngestionItem]:
        pass

    def create_item(self, title: str, description: str, source_url: str, **kwargs) -> IngestionItem:
        return IngestionItem(
            title=title,
            description=description,
            source_url=source_url,
            source_class=self.source_class,
            last_ingested_at=datetime.utcnow(),
            **kwargs,
        )

    def log_error(self, message: str):
        print(f"[{self.name}] ERROR: {message}")
