from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict


class GermanyRelevance(BaseModel):
    direct: bool
    systems_affected: List[str]
    time_to_impact: str  # kurzfristig, wochen, monate, langfristig
    description: str


class IngestionItem(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    source_url: str
    source_class: str  # behoerde, medien, wirtschaftsinstitut etc.
    last_ingested_at: datetime
    editorial_reviewed_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

    germany_relevance: GermanyRelevance
    methodology_tag: str  # steep, rca, bia, fmea, scenario
    affected_systems: List[str]
    possible_cascades: List[Dict] = Field(default_factory=list)

    severity_suggestion: str = "beobachten"
    confidence_suggestion: str = "mittel"

    raw_content: Optional[str] = None
    status: str = "raw"  # raw, extracted, in_review, approved, published

    # Indicator live-value fields (used by BNetzA adapter etc.)
    indicator_id: Optional[str] = None
    current_value: Optional[float] = None
    current_value_date: Optional[str] = None
    previous_value: Optional[float] = None
    previous_value_date: Optional[str] = None
