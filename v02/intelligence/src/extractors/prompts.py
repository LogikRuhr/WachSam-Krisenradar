from ..models import (
    CONFIDENCE_SUGGESTION_VALUES,
    METHODOLOGY_TAG_VALUES,
    SEVERITY_SUGGESTION_VALUES,
    SYSTEM_AFFECTED_VALUES,
    TIME_TO_IMPACT_VALUES,
)


WACHSAM_EXTRACT_PROMPT_VERSION = "rss-evidence-v1"


def _json_values(values: tuple[str, ...]) -> str:
    return ", ".join(f'"{value}"' for value in values)


SYSTEM_PROMPT = f"""Du bist ein WachSam-Analyst. Du analysierst belegte Signale methodisch auf ihre Relevanz für deutsche Haushalte.

Prompt-Version: {WACHSAM_EXTRACT_PROMPT_VERSION}

Regeln:
- Sei sachlich, ruhig, nicht alarmistisch.
- Keine Spekulation ohne Evidenz.
- Nutze nur Informationen aus dem übergebenen Quelltext/Excerpt.
- Wenn eine Information nicht im Text steht, verwende keine freie Behauptung.
- Confidence immer angeben.
- Fokus auf Haushaltsrelevanz.
- Antworte AUSSCHLIESSLICH als valides JSON.
- Verwende für Enum-Felder ausschließlich die unten erlaubten Werte.

Erlaubte systems_affected-Werte: [{_json_values(SYSTEM_AFFECTED_VALUES)}]
Erlaubte time_to_impact-Werte: [{_json_values(TIME_TO_IMPACT_VALUES)}]
Erlaubte methodology_tag-Werte: [{_json_values(METHODOLOGY_TAG_VALUES)}]
Erlaubte severity_suggestion-Werte: [{_json_values(SEVERITY_SUGGESTION_VALUES)}]
Erlaubte confidence_suggestion-Werte: [{_json_values(CONFIDENCE_SUGGESTION_VALUES)}]

JSON-Schema:
{{
  "title": "Klarer Titel",
  "description": "2-3 Sätze Einordnung",
  "germany_relevance": {{
    "direct": true oder false,
    "systems_affected": [ein oder mehrere erlaubte systems_affected-Werte],
    "time_to_impact": ein erlaubter time_to_impact-Wert,
    "description": "DE-spezifische Einordnung"
  }},
  "methodology_tag": ein erlaubter methodology_tag-Wert,
  "severity_suggestion": ein erlaubter severity_suggestion-Wert,
  "confidence_suggestion": ein erlaubter confidence_suggestion-Wert,
  "possible_cascades": ["Ursache → Wirkung"],
  "haushalts_auswirkungen": ["Konkrete Auswirkung auf Haushalte"],
  "buergermassnahmen": ["Ruhige, praktische Empfehlung"]
}}"""


def build_extraction_prompt(raw_content: str, source_url: str) -> str:
    return f"""Analysiere das folgende belegte Signal.

Quelle: {source_url}
Prompt-Version: {WACHSAM_EXTRACT_PROMPT_VERSION}

Quelltext/Excerpt:
{raw_content[:3000]}

Erstelle eine strukturierte WachSam-Analyse als JSON. Nutze nur den Quelltext/Excerpt als Faktengrundlage."""


EXTRACTION_RESPONSE_SCHEMA = {
    "type": "object",
    "required": [
        "title",
        "description",
        "germany_relevance",
        "methodology_tag",
        "severity_suggestion",
        "confidence_suggestion",
        "possible_cascades",
        "haushalts_auswirkungen",
        "buergermassnahmen",
    ],
    "properties": {
        "title": {"type": "string"},
        "description": {"type": "string"},
        "germany_relevance": {
            "type": "object",
            "required": ["direct", "systems_affected", "time_to_impact", "description"],
            "properties": {
                "direct": {"type": "boolean"},
                "systems_affected": {
                    "type": "array",
                    "items": {"type": "string", "enum": list(SYSTEM_AFFECTED_VALUES)},
                },
                "time_to_impact": {"type": "string", "enum": list(TIME_TO_IMPACT_VALUES)},
                "description": {"type": "string"},
            },
        },
        "methodology_tag": {"type": "string", "enum": list(METHODOLOGY_TAG_VALUES)},
        "severity_suggestion": {"type": "string", "enum": list(SEVERITY_SUGGESTION_VALUES)},
        "confidence_suggestion": {"type": "string", "enum": list(CONFIDENCE_SUGGESTION_VALUES)},
        "possible_cascades": {"type": "array", "items": {"type": "string"}},
        "haushalts_auswirkungen": {"type": "array", "items": {"type": "string"}},
        "buergermassnahmen": {"type": "array", "items": {"type": "string"}},
    },
}
