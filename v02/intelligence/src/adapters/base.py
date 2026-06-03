from abc import ABC, abstractmethod
from datetime import datetime
from typing import List

from ..models import IngestionItem


class BaseAdapter(ABC):
    """Abstrakte Basisklasse für alle strukturierten Adapter."""

    source_class: str = "behoerde"

    # Selbstbeschreibung (Defaults; konkrete Adapter überschreiben).
    # Dient dem Dry-Run-Plan und später der Source-Registry — rein statisch,
    # ohne externen Call.
    source_label: str = ""
    requires_api_key: bool = False
    writes_db: bool = True
    output_target: str = "draft"

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def fetch_latest(self) -> List[IngestionItem]:
        pass

    def describe(self) -> dict:
        """Statische Selbstbeschreibung — ohne externen Call (für --dry-run)."""
        return {
            "name": self.name,
            "source_class": self.source_class,
            "source": self.source_label or "(siehe Adapter-Code)",
            "requires_api_key": self.requires_api_key,
            "writes_db": self.writes_db,
            "output_target": self.output_target,
        }

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
