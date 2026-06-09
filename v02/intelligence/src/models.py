from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict


SYSTEM_AFFECTED_VALUES = (
    "energie",
    "lebensmittel",
    "mobilitaet",
    "gesundheit",
    "infrastruktur",
    "industrie",
    "logistik",
    "finanzen",
    "arbeit",
    "gesellschaft",
)
TIME_TO_IMPACT_VALUES = ("kurzfristig", "wochen", "monate", "langfristig")
METHODOLOGY_TAG_VALUES = ("steep", "rca", "bia", "fmea", "scenario")
SEVERITY_SUGGESTION_VALUES = ("stabil", "beobachten", "erhöht", "kritisch", "eskalierend")
CONFIDENCE_SUGGESTION_VALUES = ("niedrig", "mittel", "hoch")


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

    # Fachlicher Quellenstand — getrennt vom technischen Abruf (last_ingested_at).
    # Dual-Format: source_stand_date maschinenlesbar (ISO, z.B. "2026-05-27" oder
    # "2026-05"), source_stand_label menschenlesbar/DE (z.B. "27. Mai 2026",
    # "Mai 2026", "KW 22/2026"). NIE synthetisch aus now setzen.
    source_stand_date: Optional[str] = None
    source_stand_label: Optional[str] = None
    source_period_type: Optional[str] = None  # date | month | quarter | year | unknown
