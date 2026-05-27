import json
from datetime import datetime
from typing import Optional

from ..models import IngestionItem, GermanyRelevance
from ..config import settings
from .prompts import SYSTEM_PROMPT, build_extraction_prompt


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
        response = model.generate_content(prompt)
        text = response.text.strip()

        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        data = json.loads(text)

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
        print(f"[LLM] JSON parse error: {e}")
        return None
    except Exception as e:
        print(f"[LLM] Extraction failed: {e}")
        return None
