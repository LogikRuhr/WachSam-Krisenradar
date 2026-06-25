# Spec: Google Gen AI SDK Migration

## Ziel (in einem Satz)
Die Intelligence-Pipeline nutzt fuer Vertex AI Gemini den aktuellen `google-genai` SDK-Pfad statt des entfernten `vertexai.generative_models`-Moduls.

## Clarifications (vom Agenten gestellte Rueckfragen + meine Antworten)
- F: Soll die technische Folgewelle zur SDK-Migration jetzt umgesetzt werden? -> A: Freigabe.

## Umfang / Nicht-Umfang
- In Scope: LLM-Extractor, LLM-Tests, direkte Python-Dependencies, knappe Doku/Handoff.
- Out of Scope: Deploy, Prompt-Aenderungen, Auto-Publish, neue LLM-Modelle, Loeschen alter Google-Keys.

## Definition of Done
- [ ] `v02/intelligence/src/extractors/llm_extractor.py` importiert weder `vertexai` noch `vertexai.generative_models`.
- [ ] Der Vertex-Client wird ueber `google-genai` mit `genai.Client(vertexai=True, project=..., location=...)` erstellt.
- [ ] `client.models.generate_content(..., config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT))` ersetzt den alten `GenerativeModel`-Pfad.
- [ ] Quota-/429-Handling behaelt Retry und per-run Circuit-Breaker.
- [ ] `google-genai>=2.10,<3.0` ist direkte Dependency; `google-cloud-aiplatform` ist nicht mehr direkte Intelligence-Dependency, sofern kein anderer Scope sie nutzt.
- [ ] Tests gruen: `cd v02/intelligence && python -m pytest tests/test_llm_extractor.py -q`, `cd v02/intelligence && python -m pytest tests/ -q`, `cd v02 && pnpm run verify`, `bash scripts/verify.sh`.
- [ ] Live-Dry-Run mit lokalem Keyfile produziert keine `vertexai.generative_models`-Deprecation-Warnung.
- [ ] Keine Secrets in tracked Files.

## Schritte
1. Tests auf `google-genai`-Client-Vertrag umstellen und RED verifizieren.
2. Extractor minimal auf `google-genai` migrieren.
3. Dependencies in `pyproject.toml` und `requirements.txt` anpassen.
4. Verify-Gates und read-only Live-Dry-Run ausfuehren.
5. Separaten Commit erstellen.

## Rollback
- Welle per Commit-Revert zuruecknehmen.
- Abhaengigkeit wieder auf `google-cloud-aiplatform` setzen.
- Vorheriger lokaler Stand: `37b6f0a feat(intelligence): support google adc credentials`.
