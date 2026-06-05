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
        # W6a.1: gesammelte Quell-/Fetch-/Parsingfehler (Shadow). Rein additiv —
        # der Orchestrator liest sie aus und erzeugt C4-Shadow-Logs. Verändert
        # NICHTS am produktiven Fallback-/Insert-Pfad.
        self.source_errors: List[dict] = []

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

    def record_source_error(
        self,
        indicator_id: str,
        reason: str,
        *,
        source_url: str = None,
        source_stand: str = None,
        observed_at: str = None,
        raw_value=None,
        keep_previous: bool = True,
    ) -> None:
        """Meldet einen Quell-/Fetch-/Parsingfehler für einen bekannten Indikator.

        W6a.1 (Shadow): sammelt strukturierte Fehler in self.source_errors, die
        der Orchestrator (main.py) zu C4-Shadow-Logs verarbeitet. Rein additiv —
        ändert NICHTS am produktiven Pfad (_fallback()/insert_draft bleiben
        unberührt). Kein Block, kein Stale-on-error, kein current_value-Eingriff.
        """
        self.source_errors.append({
            "indicator_id": indicator_id,
            "reason": reason,
            "source_url": source_url,
            "source_stand": source_stand,
            "observed_at": observed_at,
            "raw_value": raw_value,
            "keep_previous": keep_previous,
        })
