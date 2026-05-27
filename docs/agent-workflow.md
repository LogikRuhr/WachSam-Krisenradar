# Agent-Workflow — WachSam

> Spielregeln für Claude Code und Codex im WachSam-Repo. Spiegelt `CLAUDE.md` und `AGENTS.md` und vertieft die operativen Patterns.

## Geltung

Diese Regeln gelten für alle Agenten, die im Repo Code, Doku oder Konfiguration verändern:

- Claude Code (Einstieg: `CLAUDE.md`)
- Codex (Einstieg: `AGENTS.md`)
- Sub-Agents jeglicher Art

Bei Konflikt zwischen `CLAUDE.md` / `AGENTS.md` und dieser Datei gilt der Einstieg. Diese Datei ist Vertiefung, keine Override.

## Pflichtregeln

Wortgleich zu `CLAUDE.md`:

1. **Plan vor Code.** Vor jedem Edit File-Liste mit ADD/CHANGE/DELETE zeigen und auf Freigabe warten.
2. **Kleine Scopes.** Eine Aufgabe pro Commit. Kein App-weiter Refactor ohne Freigabe.
3. **Keine Mockdaten, keine erfundenen Quellen.** Jedes Item in `v01/src/data/` führt eine echte URL und einen Stand.
4. **Verify vor "fertig"-Claim.** Mindestens `cd v01 && npm run typecheck && npm run build`. UI-Änderungen zusätzlich im Browser prüfen. Ab v0.3 (W1.1+): zusätzlich DB-Migration-Status, Drizzle-Schema-Check und Auth-Endpoints-Smoke unter `v02/` — Details in `docs/verification.md` (v0.3-Sektion).
5. **Blocker melden statt erfinden.** Wenn Daten oder Quellen fehlen: stoppen, nicht raten.
6. **`git add` mit expliziten Pfaden.** Nie `git add -A` oder `git add .`.
7. **Frühere Direction nicht wiederbeleben.** Die alten Produkt- und Architektur-Frames sind verworfen. Git-Historie ist die einzige Recovery-Quelle.

## Plan-vor-Code-Pattern

Vor jedem Edit zeigt der Agent eine Tabelle mit allen geplanten Änderungen:

| Aktion | Pfad | Größe (geschätzt) | Begründung |
|---|---|---|---|
| ADD | `pfad/zu/neuer-datei.ts` | ~30 Zeilen | Was die Datei tut |
| CHANGE | `pfad/zu/bestehender.tsx` | ±15 Zeilen | Welche Stelle, warum |
| DELETE | `pfad/zu/alter.md` | — | Warum weg |

Danach wartet der Agent auf Freigabe. Erst dann beginnen die Edits.

## Scope-Disziplin

- **Eine Aufgabe pro Commit.** Doku-Add und Hook-Anpassung sind zwei Commits, nicht einer.
- **Kein App-weiter Refactor ohne Freigabe.** Auch wenn der Agent „bessere" Patterns sieht — Refactor ist eine eigene Aufgabe.
- **Wave-Disziplin.** Der Rebuild-Plan in `.remember/next-session-brief.md` definiert die Wellen. Eine Welle nach der anderen, nicht parallel.

## Daten- und Quellen-Disziplin

Aus `docs/methodology.md`:

- Jedes Item in `v01/src/data/` zeigt mindestens eine Quelle mit URL und Stand.
- Erfundene Quellen sind verboten.
- LLM-generierte Inhalte ohne Beleg gehören nicht in den Seed-Datensatz.

Wenn ein Agent eine Quelle nicht verifizieren kann: Item nicht hinzufügen, sondern als Blocker melden.

## Sub-Agent-Default

- **Default: selbst arbeiten.** Sub-Agents sind die Ausnahme, nicht die Regel.
- **Wann Sub-Agent sinnvoll:** wenn der Hauptkontext sonst gesprengt würde (z.B. mehrere hundert Files lesen, große Recherche, parallele unabhängige Tasks).
- **Wann nicht:** für kleine Edits, lokale Lookups, Verify-Runs, Commit-Vorbereitung.

## Branch- und Commit-Disziplin

- Branches mit klarem Präfix: `harness-rebuild-…`, `feat-…`, `fix-…`, `docs-…`, `chore-…`.
- Commit-Subject auf Englisch, Imperativ: `add`, `update`, `fix`, `remove`, `rename`, `refactor`.
- Co-Author-Trailer bei Tool-Mitarbeit:
  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```
- Vor Commit: `git status --short` und `git diff --staged --stat` zeigen, auf Freigabe warten.
- Nie `--no-verify`. Nie Force-Push ohne explizite Freigabe.
- Bei Pre-Commit-Hook-Fail: Ursache fixen, neuen Commit erstellen — nicht `--amend` und nicht `--no-verify`.

## Sprache & Stil

- Antworten auf Deutsch.
- Code-Identifier, Tools, Commit-Subjects auf Englisch.
- Persona-frei: keine erfundenen Test-Personas mit Namen.
- Sachlich, ruhig, nicht alarmistisch.

## Verboten

- `git add -A`, `git add .` und Pattern-Globs ohne explizite Pfade.
- Restauration gelöschter Files aus dem Wave-2-Cleanup (Git-History ist die einzige Recovery-Quelle).
- Wiederbelebung alter Produkt-Frames (Bloomberg-Terminal, EUR-Impact-Card, STANDARD_HOUSEHOLD, Polykrise-Detektor, Persona-Tests).
- Mock-Daten, Platzhalter-Quellen, generierte URLs.
- Hooks oder Skripte mit Referenzen auf gelöschte Pfade.
- Secrets in tracked Files.
- PII in Repo oder Output.

## Session-Lifecycle

Aus `CLAUDE.md`:

1. **Start.** `.remember/next-session-brief.md` lesen. Klare Annahmen, klare Frage falls etwas unklar.
2. **Mitte.** Plan zeigen, Code schreiben, Verify laufen lassen.
3. **Ende.** Brief aktualisieren mit Fokus, Verify-Stand, nächstem Schritt.

Details zum Brief-Format: `docs/session-handoff.md`.
Details zum Verify-Flow: `docs/verification.md`.

## v0.3 — Backend-Pivot-Workflow (2026-05-22)

Mit dem Backend-Pivot (ADR-034 ff.) und dem parallelen `v02/`-Layout gelten zusätzlich zu den oben genannten Pflichtregeln folgende v0.3-spezifische Workflow-Erweiterungen:

- **`v02/`-Edits** brauchen die v0.3-Minimal-Gates aus `docs/verification.md`. Bei Schema- oder Migration-Edits zusätzlich `pnpm run db:migrate:check` sowie ein Postgres-Smoke mit `pnpm run db:migrate && pnpm run db:seed`. Schema-Drift zwischen `v02/db/schema/index.ts` und Migrations ist Merge-Blocker.
- **Editorial-Layer-Edits** (Approve, Reject, Publish) brauchen einen passenden Approval-Test unter `v02/tests/editorial/`. Ohne Test kein Merge in den Editorial-Pfad.
- **Live-Ingestion-Adapter** (ab W2 unter `v02/ingest-py/`) brauchen einen Run-Log-Test und ein Schema-Gate gegen die Ziel-Tabelle. Adapter ohne Schema-Validierung gehen nicht produktiv.
- **Sub-Agents dürfen DB-Migrations nicht eigenständig pushen.** Drift-Risiko ist zu hoch. Migrationsentwürfe gehen an die Hauptsession, User-Freigabe pro Migration ist Pflicht, bevor `drizzle-kit push` oder eine äquivalente Migration in die laufende DB geht.
- **Hard-Cutover-Disziplin (ADR-037):** Solange `v02/` parallel zu `v01/` läuft, ist `v01/` eingefroren. Edits an `v01/src/` sind verboten, außer für kritische Security-/Daten-Fixes mit expliziter User-Freigabe.
