# Spec: Agent Platform Intelligence Pilot

## Ziel (in einem Satz)
WachSam prueft Google Agent Platform als orchestrierten Intelligence-Layer fuer quellengebundene Krisensignal-Analyse, ohne Agent-Ausgaben produktiv zu veroeffentlichen.

## Quellenstand
- Zugriff: 2026-06-25.
- Google Agent Platform: https://cloud.google.com/products/gemini-enterprise-agent-platform
- Agent Development Kit: https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk
- Agent Platform Scale/Runtime/Sessions/Memory/Evaluation/Observability: https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale
- ADK Deploy to Agent Runtime: https://adk.dev/deploy/agent-runtime/

## Umfang / Nicht-Umfang
- In Scope: lokale ADK-Pilot-Spec, ADC/Auth-Grenzen, Modellkonfiguration, Tool-Allowlist, echte Quellen, Output-Validation, Evaluation, Observability-Konzept.
- Out of Scope: Production Agent Runtime, produktive DB-Writes, Auto-Publish, Memory Bank fuer Buergerdaten, Code Execution in Produktion, Computer Use, Managed Agents/Antigravity fuer sensitive WachSam-Daten.

## Einordnung
Der aktuelle Stand ist ein einzelner stateless Gemini-Call ueber `google-genai`: RSS-/Artikeltext rein, JSON-Draft raus, Editorial-Gate danach.

Agent Platform waere fachlich eine andere Schicht:

1. Planner/Coordinator Agent entscheidet, welche erlaubten Quellen/Tools genutzt werden.
2. Source Tools holen nur echte, datierbare Quellen.
3. Extraction Agent erzeugt strukturierte Drafts.
4. Validation Tool prueft Schema, Kanon, Quellenbindung und Frische.
5. Evaluation/Trace dokumentiert Tool-Nutzung, Modellantwort und Gate-Ergebnis.

Kein Agent-Ergebnis wird direkt publiziert. Der Editorial-Layer bleibt verbindlich.

## Architekturvorschlag

### Phase 1: Lokaler ADK-Pilot
- Lokaler Python-ADK-Agent unter separater Spec/Implementierung.
- Auth ueber ADC oder explizites Service-Account-Keyfile ausserhalb des Repos.
- Nur read-only Tools:
  - bestehende offizielle Adapter aus `v02/intelligence/src/adapters/`
  - Artikel-/Evidence-Fetcher mit erlaubten Domains
  - optional Source-Registry-Lookup
- Output nur als JSON-Datei unter `outputs/` oder stdout im Dry-Run.
- Keine Datenbankverbindung im Pilotlauf.

### Phase 2: Staging ueber Agent Runtime
- Nur nach separater Freigabe.
- Eigener Service Account mit minimalen Rollen.
- Logging, Tracing und Monitoring aktivieren.
- Agent Gateway/PSC pruefen, bevor Netzwerkzugriff erweitert wird.
- Sessions nur fuer technische Laufkontexte, nicht fuer personenbezogene Nutzerprofile.

### Phase 3: Evaluation Loop
- Kleine, echte historische Quellen-Faelle als Evaluationsset.
- Bewertung gegen:
  - JSON-Schema
  - Quellenbindung
  - WachSam-10er-Kanon
  - Frische-/Stand-Angaben
  - keine unbelegte Behauptung
  - keine PII

## Tool-Allowlist
- Erlaubt:
  - HTTP GET fuer erlaubte amtliche/qualitaetsgesicherte Quellen.
  - bestehende WachSam-Adapter im read-only Modus.
  - lokale Schema-/Validation-Funktionen.
  - Source-Registry-Lookup.
- Nicht erlaubt:
  - Shell-/Code-Execution.
  - Browser-/Computer-Use.
  - Schreibende DB-Tools.
  - Zugriff auf `.env`, Secret-Dateien oder lokale Credential-Pfade.
  - freie Websuche ohne Domain-Allowlist.

## Output-Vertrag
Jeder Agent-Draft muss enthalten:

- `title`
- `description`
- `source_url`
- `source_class`
- `source_stand`
- `evidence_excerpt`
- `germany_relevance`
- `affected_systems`
- `possible_cascades`
- `severity_suggestion`
- `confidence_suggestion`
- `methodology_tag`
- `validation_status`
- `validation_errors`
- `editorial_status = "draft"`

Fehlende Quelle, fehlender Stand oder Schemafehler fuehren zu `validation_status = "rejected"` oder `needs_review`, nie zu Publish.

## Acceptance Criteria
- [ ] Pilot nutzt nur erlaubte Quellen/Tools aus einer expliziten Allowlist.
- [ ] Jeder Draft enthaelt mindestens eine echte Quelle mit URL und Stand.
- [ ] Jeder Draft validiert gegen den WachSam-Kanon und Pflichtfelder.
- [ ] Agent-Ausgaben bleiben Drafts und erreichen keine Public UI ohne Editorial-Gate.
- [ ] Keine personenbezogenen Daten werden gespeichert, geloggt oder an Memory Bank uebergeben.
- [ ] Kein Secret, Token, ADC-Pfad oder Keyfile-Inhalt erscheint in Logs, Outputs oder tracked Files.
- [ ] Evaluation deckt mindestens drei echte historische Quellfaelle ab.
- [ ] Trace/Audit zeigt pro Draft: verwendete Tools, Quellen, Modell, Validation-Ergebnis.

## Data/API/UI Impact
- Data: Nur echte amtliche oder pruefbare Quellen im Pilot; keine Mockdaten.
- API: Spaetere Nutzung von Agent Development Kit, Agent Runtime, Evaluation Service und optional RAG/Memory wird vorbereitet, nicht implementiert.
- UI: Keine Aenderung.

## Security / DSGVO
- Keine PII und keine Haushaltsprofile im Agent-Kontext.
- Keine Memory Bank fuer Buergerdaten.
- Memory Bank spaeter nur fuer nicht-personenbezogene Methoden-/System-Memory pruefen.
- Prompt-Injection-Risiko wird als Kernrisiko behandelt:
  - Quelleninhalt darf keine Tool-Policy ueberschreiben.
  - System-/Tool-Regeln bleiben ausserhalb des Quelltexts.
  - Validation-Gate prueft auf unbelegte oder tool-injizierte Aussagen.
- Service Account braucht minimale Rollen; keine Default-Service-Accounts fuer Staging/Prod.
- Logs duerfen Quellen-URLs und Status enthalten, aber keine Secrets oder personenbezogene Daten.

## Verify
```bash
git diff --check
PATTERN='(AI''za|ya''29|-----BE''GIN|pass''word|tok''en|sec''ret|bear''er)'
! rg -n "$PATTERN" docs/specs/2026-06-25-agent-platform-intelligence-pilot.md
bash scripts/verify.sh
```

## Rollback
- Datei loeschen:
  `docs/specs/2026-06-25-agent-platform-intelligence-pilot.md`
- Keine Migration, kein Deploy, keine Runtime-Ressourcen betroffen.
