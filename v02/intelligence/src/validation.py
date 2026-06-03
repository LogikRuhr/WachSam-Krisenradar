"""Fact-to-Impact-Draft-Validierung gegen den WachSam-10er-Kanon (methodology.md).

Reine Validierungsfunktion ohne Seiteneffekte: prüft einen IngestionItem-Draft
und gibt Fehler (Kanon-Verletzung / fehlende Provenienz) sowie Hinweise
(Vollständigkeit/Qualität) zurück.

Bewusst KEINE harten Pydantic-Enums: die Funktion blockiert nicht und ändert
nichts. Die Verdrahtung (main.py) loggt das Ergebnis; invalide Drafts werden
nicht automatisch published — das Editorial-Gate entscheidet später über
Korrektur, Ablehnung oder Veröffentlichung.
"""
from dataclasses import dataclass, field
from typing import List

from .models import IngestionItem

# WachSam-Kanon (Quelle: docs/methodology.md)
SEVERITY = ("stabil", "beobachten", "erhöht", "kritisch", "eskalierend")
CONFIDENCE = ("hoch", "mittel", "niedrig")
METHODOLOGY_TAGS = ("steep", "rca", "bia", "fmea", "scenario")
TIME_TO_IMPACT = ("kurzfristig", "wochen", "monate", "langfristig")
SYSTEMBEREICHE = (
    "energie", "lebensmittel", "mobilitaet", "gesundheit", "infrastruktur",
    "industrie", "logistik", "finanzen", "arbeit", "gesellschaft",
)


@dataclass
class ValidationResult:
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    @property
    def valid(self) -> bool:
        return not self.errors


def validate_draft(item: IngestionItem) -> ValidationResult:
    """Prüft einen Draft gegen den Kanon. Reine Funktion, kein Seiteneffekt."""
    res = ValidationResult()

    # --- Kanon-Verletzungen (Fehler) ---
    if item.severity_suggestion not in SEVERITY:
        res.errors.append(f"severity '{item.severity_suggestion}' nicht im Kanon")
    if item.confidence_suggestion not in CONFIDENCE:
        res.errors.append(f"confidence '{item.confidence_suggestion}' nicht im Kanon")
    if item.methodology_tag not in METHODOLOGY_TAGS:
        res.errors.append(f"methodology_tag '{item.methodology_tag}' nicht im Kanon")

    gr = item.germany_relevance
    if gr.time_to_impact not in TIME_TO_IMPACT:
        res.errors.append(f"time_to_impact '{gr.time_to_impact}' nicht im Kanon")
    for s in gr.systems_affected:
        if s not in SYSTEMBEREICHE:
            res.errors.append(f"germany_relevance.systems_affected '{s}' nicht im Systembereich-Kanon")

    # --- Provenienz (Fehler) ---
    if not item.source_url:
        res.errors.append("source_url fehlt (Provenienz)")

    # --- Vollständigkeit / Qualität (Hinweise) ---
    if not item.description.strip():
        res.warnings.append("description leer")
    if not gr.description.strip():
        res.warnings.append("germany_relevance.description leer")
    if not gr.systems_affected:
        res.warnings.append("germany_relevance.systems_affected leer")
    for s in item.affected_systems:
        if s not in SYSTEMBEREICHE:
            res.warnings.append(f"affected_systems '{s}' nicht im Systembereich-Kanon")
    if not (item.source_stand_date or item.source_stand_label):
        res.warnings.append("kein source_stand (fachlicher Stand/Frische unbekannt)")

    return res
