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

## Memory-Vertrag (Run → Log → Distill → Repeat)
Gilt für Claude Code UND Codex. Konzept & Entscheidungen: `outputs/2026-07-16-run-log-distill-repeat-konzept.md`.
- Rollen: `.remember/` = Roh-Buffer (ungetrackt) · `LESSONS.md` = kuratierte destillierte Regeln (getrackt, beide Agenten lesen UND schreiben) · natives Claude-Memory = kuratierte Fakten. Kein System ersetzt ein anderes.
- Jeder substanzielle Run (Commits/PRs/Deploys) endet mit einem Run-Memory `.remember/runs/YYYY-MM-DD-<slug>.md` nach `TEMPLATE-run-memory.md` (Goal / Prompt / Output / What worked / What failed / Distilled rule / Next action).
- Übertragbare Regeln aus dem Run-Memory nach `LESSONS.md` destillieren. Keine Alibi-Lessons: wenn nichts gelernt, unter "Distilled rule" kurz begründen.
- Specs nach `docs/specs/TEMPLATE-spec.md` füllen das Feld "Relevante Lessons" (oder begründen "keine einschlägig").
- `next-session-brief.md` bleibt der einzige Handoff; "Next action" aus dem Run-Memory speist ihn. Kein zweites Handoff-Dokument.
- Kein "fertig"-/PASS-Claim ohne zitiertes Reviewer-Urteil; das Urteil zusätzlich als Review-Evidenz nach `.remember/tmp/review-YYYY-MM-DD-<slug>.md` legen. Ein Hook prüft nur die Existenz — die Qualität sichert der Review selbst.
- Claude-seitig erzwingen Hooks den Vertrag (SessionStart-Injection, Stop-Lesson-Gate, SessionEnd-Checkliste); für Codex gilt derselbe Vertrag konventionsgetrieben über diese Datei.
- Keine Secrets/PII in Run-Memories oder Lessons.

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

## Aktiver Stack

Aktive Arbeitsbasis ist `v02/`. Alte v0.1/v0.2- und Cutover-Texte sind historischer Kontext und dürfen neue Arbeit nicht steuern.

- `v02/web/` — Next.js 15 App Router, TypeScript strict, Public UI, Auth, Admin/UI
- `v02/db/` — Postgres 16 + Drizzle ORM, Schema, Migrations, Seed-Daten
- `v02/intelligence/` — Python-Adapter, Source Health, Evidence-first Intelligence, Vertex AI/Gemini-gestützte Extraktion mit Editorial-Gate
- `v02/infra/` — Docker-/Runtime-Artefakte für den IONOS-VPS

Aktuelle Produktwahrheit steht in `docs/product-current.md`. Bei Widerspruch gilt: `docs/product-current.md` vor älteren ADRs, Outputs oder v0.1/v0.2-Texten.

## Pflichtregeln

1. **Plan vor Code.** Vor jedem Edit File-Liste mit ADD/CHANGE/DELETE zeigen und auf Freigabe warten.
2. **Kleine Scopes.** Eine Aufgabe pro Commit. Kein App-weiter Refactor ohne Freigabe.
3. **Keine Mockdaten, keine erfundenen Quellen.** Public Content in `v02` braucht eine echte Quelle, Stand-Datum und passende Editorial-/Evidence-Gates.
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

## Aktuelle Arbeitsbasis — v02

WachSam arbeitet heute aus `v02/`. Der frühere Backend-Pivot und v01/v02-Cutover sind historischer Kontext. Für neue Arbeit gelten:

- Produktwahrheit: `docs/product-current.md`
- Repo-Struktur: `docs/repo-structure.md`
- Produktlogik: `docs/product.md` und `docs/methodology.md`
- Verify: `docs/verification.md`, `bash scripts/verify.sh`, `cd v02 && pnpm run verify`

Neue Produktfeatures gehören nach `v02/`, nicht in historische oder Root-Runtime-Pfade.
