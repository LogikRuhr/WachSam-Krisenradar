from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


FetchStatus = Literal["fetched", "fetch_failed"]
EvidenceStatus = Literal["evidence_ready", "no_evidence"]


class EvidenceRecord(BaseModel):
    """Beleganker für nichtnumerische Signale.

    RSS/Artikel/LLM-Pfade dürfen erst interpretiert werden, wenn sie auf einem
    EvidenceRecord mit Quelle, URL, Abrufstatus und stabilem Content-Hash liegen.
    """

    source_id: str
    source_name: str
    source_url: str
    published_at: str | None = None
    fetched_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    excerpt: str = ""
    raw_text: str = ""
    fetch_status: FetchStatus
    evidence_status: EvidenceStatus
    extraction_method: str
    failure_reason: str | None = None
    content_hash: str = ""

    @model_validator(mode="after")
    def set_content_hash(self) -> "EvidenceRecord":
        payload = "\n".join(
            [
                self.source_id,
                self.source_url,
                self.published_at or "",
                self.excerpt,
                self.raw_text,
                self.fetch_status,
                self.evidence_status,
                self.failure_reason or "",
            ]
        )
        self.content_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        return self
