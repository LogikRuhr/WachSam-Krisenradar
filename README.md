# WachSam

**Deutschland-zentriertes Krisen- und Haushalts-Auswirkungsradar.**

WachSam übersetzt globale Krisen und Kaskaden in verständliche Auswirkungen auf Kosten, Versorgung und Stabilität deutscher Haushalte.

## Aktiver Stack — v0.3 (Bau seit 2026-05-22, Welle W0–W1.4)

Backend-Webapp unter `v02/`. Stack-Pin: **Next.js 15** (App Router, TypeScript strict) + **Postgres 16** + **Drizzle ORM** + **Auth.js v5** (Magic-Link via **Resend**) + **Docker-Compose auf IONOS-VPS**. Live-Ingestion in Python + Scrapy folgt ab Welle W2.

Details: `v02/README.md`. Bindende ADRs: `docs/adr/034-backend-pivot.md` (Pivot), `docs/adr/037-cutover-strategy.md` (v01→v02 Cutover).

## Static-Reference — v0.1 (frozen post-W0, läuft produktiv bis Cutover W1.7)

Statische Homepage unter `v01/`. Stack: Vite, React 19, TypeScript strict, Tailwind v4. Eingefroren als Static-Reference seit Welle W0 (2026-05-22). Keine weitere Feature-Entwicklung — aktive Arbeit findet in `v02/` statt.

Details: `v01/FROZEN.md`. Bindende ADR: `docs/adr/037-cutover-strategy.md`.

```bash
cd v01
npm install
npm run dev
```

Öffnet [http://localhost:5173](http://localhost:5173).

Qualitätsgates für v0.1: `npm run typecheck`, `npm run build`, `npm test`. CI: `.github/workflows/v01-ci.yml`.

## Doku

- `repo-structure.md` — aktive Repo-Struktur und lokale Artefakt-Regeln
- `product.md` — Produktidentität
- `methodology.md` — WachSam-Logik (Signal → Relevanz → Systeme → Haushalt)
- `brand.md` — Farben, Typografie, Stilregeln
- `ui-standard.md` — Component-Patterns
- `agent-workflow.md`, `session-handoff.md`, `verification.md`, `testing.md` — Arbeitsregeln
- `git-hygiene.md` — Operative Git/GitHub-Workflow-Regeln (post-Cutover-Lessons)
- `issue-hygiene.md` — GitHub-Issue-Cleanup-Regeln nach v0.1-Cutover
- `deploy.md` — IONOS Static Deploy

## Repo-Struktur

- `v01/` — aktiver Produktcode.
- `docs/`, `specs/`, `rules/`, `references/` — Produkt-, Architektur- und Agentenwissen.
- `scripts/`, `.github/`, `infra/ionos/` — Verify, CI und Static Deploy.
- `ops/hermes-lite/` — lokale Operations-Lesesicht, nicht öffentliches Produkt.
- `outputs/` — Markdown-Reports und Plan-Artefakte; HTML-Mockups bleiben lokal/gitignored.

## Status

Aktiver Branch: `main`. Repo ist bewusst minimal: `v01/`, aktive Doku, Verify-Skripte, CI, IONOS-Static-Deploy-Artefakte und RuhrLogik-Referenz unter `infra/`.
