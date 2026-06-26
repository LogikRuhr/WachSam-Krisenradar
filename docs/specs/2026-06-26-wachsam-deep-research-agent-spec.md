# Spec: WachSam Deep-Research-Agent

## Ziel (in einem Satz)
WachSam bekommt eine reproduzierbare Deep-Research-Agent-Anweisung, die politische, wirtschaftliche und gesellschaftliche Deutschland-Stress-Themen quellengebunden, plural, haushaltsnah und editorial-gated analysiert.

## Clarifications (vom Agenten gestellte Rueckfragen + meine Antworten)
- F: Soll die Anweisung kompakt bleiben oder ausfuehrlich sein? -> A: Ausfuehrlich; kompakt reicht nur als Erinnerung, nicht fuer reproduzierbare Agentenlaeufe.
- F: Soll OERR als Leitquelle genutzt werden? -> A: Nein. Primaerquellen und nicht-OERR plural fuehren; OERR nur Kontext/Cross-Check.
- F: Soll Social Media geprueft werden? -> A: Ja, aber nur als Wahrnehmungs-/Verbreitungssignal mit Original-/Archivbeleg und Kontext.

## Quellenstand
- Zugriff: 2026-06-26.
- Google Agent Platform: https://cloud.google.com/products/gemini-enterprise-agent-platform
- Agent Development Kit: https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk
- ADK Agent Runtime: https://adk.dev/deploy/agent-runtime/
- ADK Safety: https://adk.dev/safety/
- ADK Evaluation: https://adk.dev/evaluate/
- OWASP LLM Top 10: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework
- NIST AI 600-1: https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf
- Bellingcat Social Media Verification: https://www.bellingcat.com/resources/2021/11/01/a-beginners-guide-to-social-media-verification/
- Verification Handbook: https://verificationhandbook.com/
- IFCN Code of Principles: https://ifcncodeofprinciples.poynter.org/the-commitments

## Umfang / Nicht-Umfang
- In Scope: Fachliche Deep-Research-Agent-Anweisung, Quellenhierarchie, Themenkatalog, Output-Vertrag, PASS/FAIL-Kriterien, Social-Media-Regeln, Severity/Confidence-Rubric, Eval-Faelle, Link zur bestehenden Agent-Platform-Spec.
- Out of Scope: Code-Implementierung, ADK-Agent-Code, n8n-Workflow, Agent Runtime Deployment, DB-Writes, Produktionsintegration, Auto-Publish, neue Datenquellen-Adapter.

## Problem
Der Deutschland-Stress-Test-Run zeigte, dass ein starker Chat-Agent zwar nachkorrigieren kann, aber ohne harte Spec zuerst falsche Schwerpunkte setzt: OERR zu prominent, Rentenkommission zu weich, Social Media unsystematisch. Ein reproduzierbarer Agent braucht deshalb explizite Regeln statt nur "mache gruendliche Recherche".

## Soll-Verhalten
Der Deep-Research-Agent arbeitet in dieser Reihenfolge:

1. Thema und Claim-Scope klaeren.
2. Quellenstrategie erstellen: Primaerquellen, institutionelle Quellen, nicht-OERR plural, OERR Cross-Check, Social-Media-Belege nur fuer Wahrnehmung.
3. Evidence sammeln und jede Aussage klassifizieren: `fact`, `recommendation`, `projection`, `interpretation`, `perception_signal`, `unverified_claim`.
4. WachSam-Relevanz pruefen: Deutschland, zehn Systembereiche, Haushaltswirkung, Kaskaden, Zeitfenster.
5. Severity und Confidence vorschlagen, aber als redaktionellen Vorschlag markieren.
6. Red Flags und Gegenbelege dokumentieren.
7. PASS/FAIL entscheiden: Research-Input vs. Auto-Publish.
8. Output als Markdown-Report und optional JSON-Draft erzeugen.

## Definition of Done
- [ ] `docs/intelligence/deep-research-agent-instructions.md` existiert und enthaelt Rolle, Grenzen, Quellenhierarchie, Mindestquellen, Social-Media-Regeln, Themenkatalog, Output-Format, Reject-Regeln, Severity/Confidence und Evaluation.
- [ ] `outputs/2026-06-26-deep-research-agent-requirements.md` dokumentiert die Recherchegrundlage und warum die ausfuehrliche Spec noetig ist.
- [ ] `docs/specs/2026-06-25-agent-platform-intelligence-pilot.md` verweist auf die neue Deep-Research-Agent-Anweisung als fachlichen Output-Vertrag.
- [ ] Kein Auto-Publish-Pfad, keine DB-Schreiboperation, keine Runtime-Ressource wird eingefuehrt.
- [ ] Keine PII, keine Secrets, keine Credential-Pfade.
- [ ] Verifikation: `git diff --check`, Secret-Pattern-Check auf neue/geaenderte Markdown-Dateien, `git status --short --branch --untracked-files=all`.

## Acceptance Criteria
- [ ] Quellenhierarchie fuehrt mit Primaerquellen; OERR ist explizit nur Kontext/Cross-Check.
- [ ] Mindestquellen je Deep-Research-Run: 10-15 Quellen, davon mindestens 3 Primaerquellen, 3 nicht-OERR-Sekundaerquellen und 2 begrenzende/widersprechende Quellen.
- [ ] Social-Media-Claims haben Original-/Archivbeleg, Kontext und Reichweiten-Caveat.
- [ ] Sensitive Themen erzwingen `public auto-publish: nein` und `editorial gate: required`.
- [ ] PASS/FAIL-Regeln verhindern ungepruefte parteipolitische, juristische oder Social-Media-Frames.
- [ ] Evaluation nennt mindestens die sechs Testfaelle Rente, Bundestagsflagge, Sprit 01.07., EnEfG, Umfragen/Stimmung, Meinungsfreiheit.
- [ ] Output-Format ist als konkrete Markdown-Schablone enthalten.

## Data/API/UI Impact
- Data: Keine Datenbank- oder Seed-Aenderung.
- API: Keine API-Aenderung.
- UI: Keine UI-Aenderung.
- Agent Platform: Nur fachlicher Vertrag fuer spaetere ADK-/Agent-Runtime-Arbeit; kein Deployment.

## Security / DSGVO
- Keine PII in Agent-Kontext, Logs oder Outputs.
- Keine personenbezogenen Social-Media-Kommentare extrahieren; nur oeffentliche Originalposts/Frames und aggregierte Wahrnehmung.
- Keine Secrets, Tokens, ADC-Pfade oder Keyfile-Inhalte in Output oder tracked Files.
- Prompt-Injection: Quelleninhalt darf keine Tool-/Systemregeln ueberschreiben.
- Overreliance: Modellantwort nie als Quelle behandeln; Evidence Table ist Pflicht.
- Sensitive politische Themen duerfen nicht auto-published werden.

## Verify
```powershell
git diff --check
$pattern = '(AI' + 'za|ya' + '29|-----BE' + 'GIN|private_' + 'key|client_' + 'secret|bearer\s+[A-Za-z0-9_\-.]+|pass' + 'word\s*=|tok' + 'en\s*=|sec' + 'ret\s*=)'
rg -n $pattern outputs/2026-06-26-deep-research-agent-requirements.md docs/specs/2026-06-26-wachsam-deep-research-agent-spec.md docs/intelligence/deep-research-agent-instructions.md docs/specs/2026-06-25-agent-platform-intelligence-pilot.md
git status --short --branch --untracked-files=all
```

## Rollback
- `outputs/2026-06-26-deep-research-agent-requirements.md` loeschen.
- `docs/specs/2026-06-26-wachsam-deep-research-agent-spec.md` loeschen.
- `docs/intelligence/deep-research-agent-instructions.md` loeschen.
- Link/Verweis aus `docs/specs/2026-06-25-agent-platform-intelligence-pilot.md` entfernen.

## Schritte
1. Requirements-Output aus lokaler und externer Recherche erstellen.
2. Agent-Spec als Doku-Spec anlegen.
3. Ausfuehrliche Deep-Research-Agent-Anweisung anlegen.
4. Bestehende Agent-Platform-Spec verlinken.
5. Diff-/Secret-/Status-Checks ausfuehren.
