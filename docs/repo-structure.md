# Repo Structure

WachSam folgt ab v0.1 einem kleinen, klaren Repo-Kern. Referenz fuer die Strukturdisziplin sind `browser-use/browser-use` und `browser-use/browser-harness`: wenige Top-Level-Bereiche, klare Trennung zwischen Produktcode, Doku, Ops, Agent-Artefakten und lokalen Experimenten.

## Top-Level-Bereiche

| Pfad | Zweck | Tracking-Regel |
|---|---|---|
| `v01/` | Statische WachSam-Webapp: Vite, React, TypeScript, Tailwind, Seed-Daten, Tests; eingefroren als Static-Reference ab W0-Closeout (2026-05-22) | aktiv getrackt, **edits gesperrt** (siehe `v01/FROZEN.md`, ADR-037) |
| `v02/` | Backend-Webapp (Next.js 15, Postgres 16, Drizzle, Auth.js v5, Resend), ab W1.1 | aktiv getrackt ab W1.1 |
| `v02/web/` | Next.js-App-Router-Frontend in TypeScript | aktiv getrackt ab W1.1 |
| `v02/db/` | Drizzle-Schema und Migrationsdateien | aktiv getrackt ab W1.1 |
| `v02/infra/` | Docker-Compose und IONOS-VPS-Deploy-Artefakte | aktiv getrackt ab W1.1 |
| `v02/ingest-py/` | Python-Scrapy-Live-Ingestion-Adapter (ab W2) | aktiv getrackt ab W2 |
| `v02/intelligence/` | Intelligence-Pipeline: Python-Adapter, LLM-Extractor, Pydantic-Models (ADR-039, ab W2.1) | aktiv getrackt ab W2.1 |
| `intelligence/` | Intelligence-Specs: Rollen, Prompts, Templates, Output-Schema, Architektur-Konzept | aktiv getrackt |
| `docs/` | Produkt-, Methodik-, Brand-, UI-, Deploy- und Workflow-Doku | aktiv getrackt |
| `docs/adr/` | Architekturentscheidungen | aktiv getrackt |
| `specs/` | Wellen- und Feature-Vertraege | aktiv getrackt |
| `rules/` | Operative Regeln fuer Agenten und Workflows | aktiv getrackt |
| `references/` | Nicht-normative Analysen und Referenzen | nur wenn aktuell relevant |
| `scripts/` | Repo-weite Verify-, Smoke-, Deploy- und Session-Helfer | aktiv getrackt |
| `infra/ionos/` | IONOS-Static-Deploy-Artefakte und Runbooks | aktiv getrackt |
| `ops/hermes-lite/` | experimentelle lokale Operations-Lesesicht | getrackt, aber keine Produkt-Runtime |
| `.github/` | CI und GitHub-Workflows | aktiv getrackt |
| `.remember/` | Session-Handoff und agentenspezifische Briefs | nur freigegebene Brief-Dateien |
| `outputs/` | explizite Markdown-Reports und Plan-Artefakte | `.md` bevorzugt, HTML lokal/gitignored |

## Verbotene Runtime-Rueckkehr

Diese Pfade duerfen nicht als aktive Runtime wiederbelebt werden, auch nach dem v0.3-Backend-Pivot:

- Root-`src/`
- Root-`tests/`
- `src/db/`, `src/adapters/`, `src/app/`
- Root-Next.js-, Vercel-, Drizzle-, Auth-, Stripe- oder Cron-Strukturen
- neue API-, Datenbank- oder Scheduler-Pfade ausserhalb von `v02/` ohne akzeptierte Spec und ADR

Recovery-Quelle fuer alte Dateien ist Git-Historie, nicht lokales Copy-Back.

**Legitimer Backend-Pfad ab W1.1:** `v02/` (siehe ADR-034 ff.). Alle Backend-, DB-, Auth-, API- und Ingestion-Arbeit findet ausschliesslich dort statt — nicht im Root-`src/` und nicht innerhalb von `v01/`.

## Lokale Artefakte

Nicht getrackt werden:

- `.superpowers/`
- `.codex/`
- `.playwright-mcp/`
- `node_modules/`
- `outputs/**/*.html`
- PII- oder maschinenspezifische Dateien unter `outputs/`

Wenn ein visuelles Mockup dauerhaft wichtig ist, wird es als kurzer Markdown-Report mit Link/Quelle dokumentiert. Roh-HTML bleibt lokal.

## Repo-Gesundheitscheck

Vor jeder Cleanup- oder Struktur-Welle:

```bash
git status -sb --untracked-files=all
git ls-files -o --exclude-standard
git ls-files -m
gh issue list --state open --limit 100
```

Vor Abschluss:

```bash
git diff --check
bash scripts/verify.sh
```
