# AGENTS.md — Globale Regeln (Jean / RuhrLogik)

## Identitaet
Jean Schütz, Founder RuhrLogik. Technisch versiert, erwartet autonomes Arbeiten.
Hauptprojekt: WachSam Krisenradar. Workspace: wachsam-app.

## Sprache & Stil
- Antworten auf Deutsch, Code auf Englisch
- Kein Filler, keine Zusammenfassungen am Ende
- Technische Begriffe im Original belassen

## Sicherheit (IMMER)
- NIEMALS Secrets in tracked Files — .gitignore ZUERST
- Security-Check vor jedem Commit (Credentials, OWASP)
- Bei Secret-Leak: sofort rotieren
- DSGVO: Keine PII in Datenbanken, Chats oder sonstigen öffentlichen Daten, nur    anonymisierte Scores

## Arbeitsweise
- Plan-First: Keine Code-Aenderung ohne Plan
- Fakten-Treue: API-Doku ist Gesetz, nichts erfinden
- Verify vor Claim: Gegen Live-Daten pruefen, nicht nur Code lesen
- Opus fuer Plans/Architektur, Sonnet fuer Tasks, Haiku fuer Checks

## Qualitaets- & Lern-System (Simply First)
- Bei unklarem oder schwachem Input: erst Rueckfragen, dann Plan. Der Plan nennt Scope, File-Liste, Acceptance, Verify und Rollback.
- Jede relevante Aufgabe nutzt eine Spec, bevorzugt `docs/specs/TEMPLATE-spec.md`. Keine Arbeit ohne Definition of Done.
- Verifikation ist getrennt von Implementierung: Tests/Lint/Typecheck/Build laufen vor "fertig"; danach prueft ein zweiter Reviewer den Diff gegen die Definition of Done mit klarem PASS oder FAIL.
- Claude Code: fuer das DoD-Gate lokal `.claude/agents/reviewer.md` nutzen, falls vorhanden. `/code-review` ist nur ergaenzend fuer Diff-Bugs und Cleanups; es ersetzt das PASS/FAIL-DoD-Gate nicht.
- Reviewer bleiben read-only: Diff pruefen, DoD abhaken, Sicherheits-/DSGVO-Risiken melden, keine Files aendern.
- Echte Lessons kommen aus Tests, Linter, Builds, Reviews oder User-Feedback. In `LESSONS.md` nur konkrete Handlung, Datum und Confidence eintragen.

## Aktuelle Verify-Gates
- Root/Security: `bash scripts/verify.sh`
- v02 TypeScript/Next.js: `cd v02 && pnpm run verify`
- Python Intelligence: `cd v02/intelligence && python -m pytest tests/ -q`
- Python-Linter: aktuell keiner konfiguriert; kein `ruff`/`mypy` in `pyproject.toml` oder `requirements.txt`.

## Infrastruktur
- Zeitzone: Europe/Berlin (MESZ, UTC+2) — `TZ='Europe/Berlin' date`
- IONOS VPS 24GB RAM
- wachsam: wachsam.ruhrlogik.de
- n8n Dashboard: https://n8n.ruhrlogik.de

## Konventionen
- READMEs max 150-200 Woerter
- Outputs als .md in outputs/
- Token-ROI beachten: nur relevante Dateien laden

--- project-doc ---

# AGENTS.md — Einstieg für Codex

WachSam ist ein **Deutschland-zentriertes Krisen- und Haushalts-Auswirkungsradar** für Bürger, Haushalte und kleine Unternehmen. Es übersetzt globale Krisen, systemische Risiken und Kaskaden in verständliche Auswirkungen auf Kosten, Versorgung und Stabilität deutscher Haushalte.

Diese Datei spiegelt `CLAUDE.md` und ist die Codex-Eintrittsstelle. Sie bleibt kurz. Inhalt steht in `docs/`.

## Kanonische Doku

Produkt-Source-of-Truth (Pflichtlektüre am Session-Start, getrackt seit Wave 7.6-1):

- `docs/# WachSam.md`
- `docs/# WachSam — Logik, Funktion & Metho.md`

Operationalisierte Repo-Doku (additiv auf SoT alignedet, Wave 7.6-2/3):

- `docs/product.md`
- `docs/methodology.md`
- `docs/brand.md`
- `docs/ui-standard.md`

Operative Workflow-Doku:

- `docs/agent-workflow.md`
- `docs/session-handoff.md`
- `docs/verification.md`
- `docs/testing.md`
- `docs/repo-structure.md`
- `docs/issue-hygiene.md`

## Session-Brief lesen

Pflicht-Read am Session-Start, zusätzlich zur kanonischen Doku:

- `.remember/next-session-brief.md` — Welle-für-Welle-Stand des Repos, primary truth.
- `.remember/codex-session.md` — eigene Per-Session-Sicht (One Task, Spec-Anker, Verify-Erwartung). Fallback: `.remember/codex-brief-template.md`, falls erstes File noch nicht existiert.

Codex schreibt am Session-Ende ausschließlich den eigenen `codex-session.md`, niemals `claude-session.md`. Geteilter `next-session-brief.md` wird durch denjenigen Agent gepflegt, der die abschließende Welle gefahren hat. Vertrag: `specs/04-shared-operational-surface.md`.

## Aktiver Stack — v0.3 (Bau ab W1.1)

Backend-Webapp unter `v02/` (parallel zu `v01/`, Hard-Cutover sobald W1.7 ready):

- Next.js 15 (App Router, TypeScript strict)
- Postgres 16 + Drizzle ORM
- Auth.js v5 (Sessions, Magic-Link via Resend)
- Editorial-Layer für kuratierte Inhalte
- Live-Ingestion in Python + Scrapy (ab W2)
- Intelligence-Pipeline: Vertex AI Gemini + Python-Adapter unter `v02/intelligence/` (ab W2.1, ADR-039)
- Docker-Compose auf IONOS-VPS

`v01/` wird post-W0 als Static-Reference eingefroren (nicht gelöscht, nicht weiterentwickelt). Verbindliche Architekturentscheidungen: ADR-034 (Pivot), ADR-035 (Postgres), ADR-036 (Stack TS+Python), ADR-037 (Cutover), ADR-038 (Ingestion), ADR-039 (Intelligence Core).

## Static-Reference Stack — v0.1 (frozen post-W0)

Statische Webapp unter `v01/`, eingefroren seit Welle W0 (2026-05-22). Läuft produktiv bis Hard-Cutover (W1.7), aber keine Feature-Entwicklung mehr:

- Vite 6
- React 19
- TypeScript 5.x (strict)
- Tailwind CSS 4 (CSS-first config über `@theme`-Block in `v01/src/index.css`)
- Lokale TypeScript-Seed-Daten in `v01/src/data/`

Es gibt **kein Backend, keine Datenbank, keine APIs und keine Cron-Pipeline** in v0.1. Deploy ist statisch über IONOS/GitHub Actions (`workflow_dispatch`) dokumentiert in `docs/deploy.md`.

> **Hinweis:** v0.3 (ab W0/W1.1, 2026-05-22) wechselt diese Architektur — siehe ADR-034 ff. und die `## v0.3-Hinweis`-Sektion am Ende dieser Datei.

## Pflichtregeln

1. **Plan vor Code.** Vor jedem Edit File-Liste mit ADD/CHANGE/DELETE zeigen und auf Freigabe warten.
2. **Kleine Scopes.** Eine Aufgabe pro Commit. Kein App-weiter Refactor ohne Freigabe.
3. **Keine Mockdaten, keine erfundenen Quellen.** Jedes Item in `v01/src/data/` führt eine echte URL und einen Stand.
4. **Verify vor "fertig"-Claim.** `scripts/verify.sh` ist das primäre Verify-Gate; Typecheck, Build und Tests sind mandatory. UI-Änderungen zusätzlich im Browser prüfen.
5. **Blocker melden statt erfinden.** Wenn Daten oder Quellen fehlen: stoppen, nicht raten.
6. **`git add` mit expliziten Pfaden.** Nie `git add -A` oder `git add .`.
7. **Frühere Direction nicht wiederbeleben.** Die alten Produkt- und Architektur-Frames sind verworfen. Recovery-Quellen sind Git-Historie sowie die remote-persistenten Backup-Branches `main-snapshot-pre-rebuild-2026-05-14`, `archive/pre-rebuild-2026-05-12` und `harness-rebuild-v01` (Letzteres als 30-Tage-Backup-Hold bis 2026-06-14).

## Sprache & Stil

- Antworten auf Deutsch.
- Code-Identifier, Tools, Commit-Subjects auf Englisch.
- Persona-frei: keine erfundenen Test-Personas mit Namen.
- Sachlich, ruhig, nicht alarmistisch.

## Output discipline

Token-Effizienz, ohne Plan-vor-Code, Verify oder Sicherheit zu verlieren.

- **Pläne kompakt halten.** Plan-vor-Code bleibt Pflicht. Inhalt vollständig (Scope, Files, Acceptance, Verify, Rollback), aber ohne Wiederholung, ohne Marketing-Prosa, ohne Reflexion am Ende.
- **Implementierungs-Reports kurz.** Verify-Status, Bundle-Diff, `git diff --stat`, `git status --short`. Keine Re-Beschreibung der Änderung — die liegt im Commit.
- **Commit-Reports minimal.** Commit-SHA, Subject, working tree status. Kein Wellen-Resümee, kein Self-Review.
- **Sub-Agents nur für kontextschonende Audits.** Erlaubt für read-only Recherche, Doku-Lesungen oder Diff-Analysen, die sonst den Hauptkontext sprengen.
- **Sub-Agents entscheiden keine Architektur.** Vorschläge gehen an den Hauptlauf; Entscheidungen trifft die Hauptsession mit Userfreigabe.
- **Sub-Agents bearbeiten keine Files** ohne explizite User-Freigabe pro Edit.
- **HTML-/Browser-Mockups bleiben lokal.** `.superpowers/` und `outputs/**/*.html` werden nicht getrackt. Dauerhafte Design- oder Audit-Ergebnisse als kurze `.md`-Artefakte in `outputs/` ablegen.

## Session lifecycle

Claude:
- start new session after major waves or around 50% context
- read SoT (`docs/# WachSam.md`, `docs/# WachSam — Logik, Funktion & Metho.md`) und `.remember/next-session-brief.md` am Session-Start
- update next-session-brief before ending

Codex:
- prefer one task per session
- read SoT und `.remember/next-session-brief.md` am Session-Start
- end session after verify + clean working tree

Rules:
- no other edits
- no wording expansion
- keep both files aligned

Sub-Agents nur einsetzen, wenn der Hauptkontext sonst gesprengt würde. Default: selbst arbeiten.

## Branch- und Commit-Disziplin

- **Default-Branch ist `main` seit Cutover 2026-05-15.** Feature-Branches starten ab `main` (`git checkout main && git pull --ff-only && git checkout -b <prefix>-<thema>`). Keine Arbeit auf alten `issue/*`- oder `codex/*`-Branches ohne explizite Revive-Welle.
- Branches mit klarem Präfix (`feat-…`, `fix-…`, `docs-…`, `chore-…`, `ci-…`, `data-…`, `test-…`, `refactor-…`, `release-…`).
- `harness-rebuild-v01` ist Backup-Branch (30-Tage-Hold bis 2026-06-14) — nicht löschen, nicht als Working-Branch nutzen.
- Snapshot- und Archive-Branches (`main-snapshot-pre-rebuild-2026-05-14`, `archive/pre-rebuild-2026-05-12`) sind read-only.
- Commit-Subject auf Englisch, Imperativ.
- Co-Author-Trailer bei Tool-Mitarbeit.
- Vor Commit: `git status --short`, `git diff --staged --name-only` und `git diff --staged --stat` zeigen, auf Freigabe warten.
- Nie `--no-verify`, nie Force-Push ohne explizite Freigabe. Force-Push auf `main` erfordert eine kontrollierte Welle mit Backup-Snapshot, kurzem `allow_force_pushes`-Toggle und sofortigem Re-Lock; ausschließlich `--force-with-lease` mit explizitem Lease-SHA.

## v0.3-Hinweis — Backend-Pivot ab W0 (2026-05-22)

Mit Welle W0 (Doku-Vorbereitung) und Welle W1.1+ (Implementation) wechselt WachSam vom statischen v0.1-Stack zu einem Backend-Stack unter `v02/`. Bindende ADRs:

- `docs/adr/034-backend-pivot.md` — Pivot-Entscheidung und Begründung
- `docs/adr/035-postgres-choice.md` — Postgres 16 als Primärspeicher
- `docs/adr/036-stack-ts-python.md` — Next.js 15 + Python-Ingestion
- `docs/adr/037-cutover-strategy.md` — v01→v02 Hard-Cutover-Plan
- `docs/adr/038-ingestion-architecture.md` — Live-Ingestion mit Scrapy
- `docs/adr/039-intelligence-core.md` — LLM-gestützte Signalanalyse mit Editorial-Gate

Updated SoT- und Workflow-Files mit v0.3-Sektionen:

- `docs/product.md` — Backend-Funktionsumfang
- `docs/methodology.md` — Live-Ingestion-Methodik
- `docs/brand.md` — Backend-UX-Token
- `docs/ui-standard.md` — Authentifizierte Routen und Editorial-Patterns
- `docs/agent-workflow.md` — Backend-Pivot-Workflow
- `docs/repo-structure.md` — `v02/`-Layout
- `docs/verification.md` — DB-Migration- und Auth-Smoke
- `docs/testing.md` — Integration-Tests mit Postgres-Container

`v01/` bleibt als Static-Reference eingefroren bis Hard-Cutover (W1.7).
