import asyncio
import json
import logging
import re
from datetime import datetime
from typing import Optional

from google.api_core.exceptions import ResourceExhausted

from ..models import (
    CONFIDENCE_SUGGESTION_VALUES,
    IngestionItem,
    GermanyRelevance,
    METHODOLOGY_TAG_VALUES,
    SEVERITY_SUGGESTION_VALUES,
    SYSTEM_AFFECTED_VALUES,
    TIME_TO_IMPACT_VALUES,
)
from ..config import settings
from .prompts import SYSTEM_PROMPT, build_extraction_prompt


logger = logging.getLogger(__name__)
MAX_LLM_ATTEMPTS = 3
LLM_RETRY_DELAYS_SECONDS = (2, 4)


def _validate_llm_payload(data: dict, source_url: str) -> bool:
    gr = data.get("germany_relevance", {})
    errors = []

    systems = gr.get("systems_affected", [])
    if not isinstance(systems, list) or any(system not in SYSTEM_AFFECTED_VALUES for system in systems):
        errors.append("germany_relevance.systems_affected")

    if gr.get("time_to_impact") not in TIME_TO_IMPACT_VALUES:
        errors.append("germany_relevance.time_to_impact")

    if data.get("methodology_tag") not in METHODOLOGY_TAG_VALUES:
        errors.append("methodology_tag")

    if data.get("severity_suggestion") not in SEVERITY_SUGGESTION_VALUES:
        errors.append("severity_suggestion")

    if data.get("confidence_suggestion") not in CONFIDENCE_SUGGESTION_VALUES:
        errors.append("confidence_suggestion")

    if not errors:
        return True

    logger.warning(
        "LLM schema validation failed",
        extra={"source_url": source_url, "invalid_fields": errors},
    )
    print(f"[LLM] Schema validation failed: {', '.join(errors)}")
    return False


def _init_vertex():
    import vertexai

    vertexai.init(
        project=settings.GOOGLE_CLOUD_PROJECT,
        location=settings.VERTEX_AI_LOCATION,
    )


async def extract_with_llm(
    raw_content: str, source_url: str, source_class: str
) -> Optional[IngestionItem]:
    """Vertex AI Gemini Call mit Pflicht-Output-Schema.

    Gibt ein IngestionItem mit status='extracted' zurück.
    Final-Werte setzt die Redaktion im Editorial-Gate.
    """
    if not settings.GOOGLE_CLOUD_PROJECT:
        print("[LLM] GOOGLE_CLOUD_PROJECT nicht gesetzt — Skip")
        return None

    try:
        _init_vertex()
        from vertexai.generative_models import GenerativeModel

        model = GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )

        prompt = build_extraction_prompt(raw_content, source_url)
        response = None
        for attempt in range(1, MAX_LLM_ATTEMPTS + 1):
            try:
                response = model.generate_content(prompt)
                break
            except ResourceExhausted as e:
                if attempt >= MAX_LLM_ATTEMPTS:
                    logger.warning(
                        "LLM unavailable after retries",
                        extra={"source_url": source_url, "attempts": attempt, "error": str(e)},
                    )
                    print(f"[LLM] Extraction failed: llm_unavailable after {attempt} attempts")
                    return None

                delay = LLM_RETRY_DELAYS_SECONDS[attempt - 1]
                logger.warning(
                    "LLM quota exhausted; retrying",
                    extra={"source_url": source_url, "attempt": attempt, "delay_seconds": delay},
                )
                await asyncio.sleep(delay)

        if response is None:
            return None

        text = response.text.strip()

        if text.startswith("```"):
            match = re.search(r"\{.*\}", text, re.DOTALL)
            text = match.group(0) if match else text

        data = json.loads(text)
        if not _validate_llm_payload(data, source_url):
            return None

        gr = data.get("germany_relevance", {})
        return IngestionItem(
            title=data.get("title", "Unbekanntes Signal"),
            description=data.get("description", ""),
            source_url=source_url,
            source_class=source_class,
            last_ingested_at=datetime.utcnow(),
            germany_relevance=GermanyRelevance(
                direct=gr.get("direct", False),
                systems_affected=gr.get("systems_affected", []),
                time_to_impact=gr.get("time_to_impact", "wochen"),
                description=gr.get("description", "Automatisch extrahiert"),
            ),
            methodology_tag=data.get("methodology_tag", "steep"),
            affected_systems=gr.get("systems_affected", []),
            possible_cascades=[{"chain": c} for c in data.get("possible_cascades", [])],
            severity_suggestion=data.get("severity_suggestion", "beobachten"),
            confidence_suggestion=data.get("confidence_suggestion", "niedrig"),
            raw_content=raw_content[:1000],
            status="extracted",
        )

    except json.JSONDecodeError as e:
        logger.warning("LLM JSON parse error", extra={"source_url": source_url, "error": str(e)})
        print(f"[LLM] JSON parse error: {e}")
        return None
    except Exception as e:
        logger.warning("LLM extraction failed", extra={"source_url": source_url, "error": str(e)})
        print(f"[LLM] Extraction failed: {e}")
        return None
