import asyncio
import json
import logging
import os
import re
from datetime import datetime
from typing import Optional

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
from .prompts import EXTRACTION_RESPONSE_SCHEMA, SYSTEM_PROMPT, build_extraction_prompt


logger = logging.getLogger(__name__)
MAX_LLM_ATTEMPTS = 3
LLM_RETRY_DELAYS_SECONDS = (2, 4)
_CREDENTIAL_PLACEHOLDER_MARKERS = (
    "/pfad/zu/",
    "\\pfad\\zu\\",
    "path/to/",
    "<",
    "your_",
    "replace",
)
_LLM_CREDENTIALS_WARNING_EMITTED = False
_LLM_QUOTA_EXHAUSTED = False
_LLM_QUOTA_SKIP_WARNING_EMITTED = False


def _llm_configuration_skip_reason() -> Optional[str]:
    project = (settings.GOOGLE_CLOUD_PROJECT or "").strip()
    if not project:
        return "GOOGLE_CLOUD_PROJECT nicht gesetzt"

    credentials_path = (settings.GOOGLE_APPLICATION_CREDENTIALS or "").strip()
    if not credentials_path:
        return "GOOGLE_APPLICATION_CREDENTIALS nicht gesetzt"

    normalized = credentials_path.replace("\\", "/").lower()
    if any(marker in normalized for marker in _CREDENTIAL_PLACEHOLDER_MARKERS):
        return "GOOGLE_APPLICATION_CREDENTIALS ist ein Placeholder"

    if not os.path.isfile(credentials_path):
        return "GOOGLE_APPLICATION_CREDENTIALS nicht lesbar"

    return None


def _print_credentials_skip_once(reason: str) -> None:
    global _LLM_CREDENTIALS_WARNING_EMITTED
    if _LLM_CREDENTIALS_WARNING_EMITTED:
        return
    print(f"[LLM] {reason} — Skip")
    _LLM_CREDENTIALS_WARNING_EMITTED = True


def _print_quota_skip_once() -> None:
    global _LLM_QUOTA_SKIP_WARNING_EMITTED
    if _LLM_QUOTA_SKIP_WARNING_EMITTED:
        return
    print("[LLM] Quota exhausted earlier in this run — Skip")
    _LLM_QUOTA_SKIP_WARNING_EMITTED = True


def reset_llm_runtime_state() -> None:
    """Reset per-run skip/circuit-breaker state for scheduled ingestion."""
    global _LLM_CREDENTIALS_WARNING_EMITTED, _LLM_QUOTA_EXHAUSTED, _LLM_QUOTA_SKIP_WARNING_EMITTED
    _LLM_CREDENTIALS_WARNING_EMITTED = False
    _LLM_QUOTA_EXHAUSTED = False
    _LLM_QUOTA_SKIP_WARNING_EMITTED = False


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


def _create_genai_client():
    from google import genai

    return genai.Client(
        vertexai=True,
        project=settings.GOOGLE_CLOUD_PROJECT,
        location=settings.VERTEX_AI_LOCATION,
    )


def _create_generate_config():
    from google.genai import types

    return types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        response_mime_type="application/json",
        response_json_schema=EXTRACTION_RESPONSE_SCHEMA,
        temperature=0.2,
    )


def _is_quota_error(error: Exception) -> bool:
    code = getattr(error, "code", None)
    if code == 429 or str(code) == "429":
        return True
    marker = f"{error.__class__.__name__} {error}".lower()
    return "resourceexhausted" in marker or "resource exhausted" in marker or "quota" in marker


def _parse_response_json(response) -> dict:
    parsed = getattr(response, "parsed", None)
    if isinstance(parsed, dict):
        return parsed

    text = str(getattr(response, "text", "")).strip()
    if text.startswith("```"):
        match = re.search(r"\{.*\}", text, re.DOTALL)
        text = match.group(0) if match else text
    return json.loads(text)


async def extract_with_llm(
    raw_content: str, source_url: str, source_class: str
) -> Optional[IngestionItem]:
    """Vertex AI Gemini Call mit Pflicht-Output-Schema.

    Gibt ein IngestionItem mit status='extracted' zurück.
    Final-Werte setzt die Redaktion im Editorial-Gate.
    """
    global _LLM_QUOTA_EXHAUSTED

    skip_reason = _llm_configuration_skip_reason()
    if skip_reason:
        _print_credentials_skip_once(skip_reason)
        return None

    if _LLM_QUOTA_EXHAUSTED:
        _print_quota_skip_once()
        return None

    try:
        client = _create_genai_client()
        config = _create_generate_config()
        prompt = build_extraction_prompt(raw_content, source_url)
        response = None
        for attempt in range(1, MAX_LLM_ATTEMPTS + 1):
            try:
                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL_ID,
                    contents=prompt,
                    config=config,
                )
                break
            except Exception as e:
                if not _is_quota_error(e):
                    raise
                if attempt >= MAX_LLM_ATTEMPTS:
                    logger.warning(
                        "LLM unavailable after retries",
                        extra={"source_url": source_url, "attempts": attempt, "error": str(e)},
                    )
                    _LLM_QUOTA_EXHAUSTED = True
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

        data = _parse_response_json(response)
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
