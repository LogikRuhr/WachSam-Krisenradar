from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Iterable, Literal

from pydantic import BaseModel


SourceHealthStatus = Literal["ok", "degraded", "failed"]


class SourceHealthRecord(BaseModel):
    source_id: str
    source_name: str
    target: str
    status: SourceHealthStatus
    last_checked_at: str
    last_success_at: str | None
    item_count: int
    error_count: int
    error_messages: list[str]


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def build_source_health(
    adapter,
    *,
    item_count: int,
    source_errors: list[dict],
    checked_at: datetime | None = None,
) -> SourceHealthRecord:
    checked_at = checked_at or datetime.utcnow()
    description = adapter.describe() if hasattr(adapter, "describe") else {}
    source_name = description.get("name") or getattr(adapter, "name", "unknown")
    target = description.get("output_target") or "unknown"
    source_id = _slug(source_name)
    error_messages = [str(err.get("reason") or err.get("error") or err) for err in source_errors]
    error_count = len(error_messages)

    if item_count > 0 and error_count == 0:
        status: SourceHealthStatus = "ok"
    elif item_count > 0:
        status = "degraded"
    else:
        status = "failed" if error_count else "degraded"

    checked = checked_at.isoformat()
    return SourceHealthRecord(
        source_id=source_id,
        source_name=source_name,
        target=target,
        status=status,
        last_checked_at=checked,
        last_success_at=checked if item_count > 0 else None,
        item_count=item_count,
        error_count=error_count,
        error_messages=error_messages,
    )


def persist_source_health(records: Iterable[SourceHealthRecord], path: str | Path) -> None:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("a", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(record.model_dump(), ensure_ascii=False, sort_keys=True) + "\n")
