# Spec: Intelligence GenAI Research Agent

## Ziel (in einem Satz)
Der unstrukturierte RSS/LLM-Pfad nutzt nicht mehr das auslaufende `vertexai.generative_models`, sondern `google-genai` mit konfigurierbarem Modell und erzeugt nur qualitaetsgepruefte Editorial-Drafts hinter Feature-Flag.

## Clarifications (vom Agenten gestellte Rueckfragen + meine Antworten)
- F: Darf der Research-Agent publishen? -> A: Nein, niemals. Nur Draft-Vorschlaege.
- F: Duerfen deterministische Indikator-Adapter veraendert werden? -> A: Nein.
- F: Soll Google ADK direkt als Cloud Agent Engine deployed werden? -> A: Nein, zuerst lokaler/containerfaehiger MVP mit ADK-kompatibler Struktur.

## Umfang / Nicht-Umfang
- In Scope: `google-genai` Migration, `GEMINI_MODEL_ID`, bessere JSON-/Schema-Konfiguration, Evidence-Quality-Gate, Research-Agent-MVP hinter `WACHSAM_RESEARCH_AGENT_ENABLED`.
- In Scope: Tests gegen SDK-Wrapper, Quota-Circuit-Breaker, schlechte Evidence, No-Auto-Publish-Invariant.
- Out of Scope: Prod-Deploy, Admin-User-Erstellung, Google Agent Engine Deployment, neue externe Quellen, Aenderungen an Adapter-Parsing oder Indikator-DB-Pfad.

## Definition of Done
- [ ] Kein `vertexai.generative_models` Import im Intelligence-Code.
- [ ] Modell-ID ist ueber `GEMINI_MODEL_ID` konfigurierbar.
- [ ] LLM/Agent-Output kann keinen `published` Status durchsetzen.
- [ ] Schlechte Evidence erzeugt keinen Lagebild-Draft.
- [ ] Deterministische Adapter-Tests bleiben unveraendert gruen.
- [ ] Tests gruen - TS: `cd v02 && pnpm run verify` . Python: `cd v02/intelligence && python -m pytest tests/ -q`
- [ ] Lint/Typecheck ok - in `pnpm run verify` enthalten (`eslint --max-warnings 0` + `tsc --noEmit`); Python: kein separater Linter konfiguriert
- [ ] PASS durch zweiten DoD-Reviewer - lokal `.claude/agents/reviewer.md`; `/code-review` nur ergaenzend fuer Diff-Bugs/Cleanups

## Schritte
1. Spec und Plan-Artefakt anlegen.
2. `google-genai` SDK-Wrapper testgetrieben in `llm_extractor.py` migrieren.
3. Modell-Konfiguration und JSON-Schema-Konfiguration testgetrieben absichern.
4. Research-Agent-MVP als separaten, eng begrenzten Pfad anlegen.
5. RSS-Orchestrator per Feature-Flag auf Agent-Pfad schaltbar machen.
6. Verify-Gates ausfuehren und Diff gegen DoD pruefen.
