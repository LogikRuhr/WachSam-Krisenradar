# v02 — WachSam Backend-App

Backend-App seit Welle W0 (2026-05-22). Löst die statische `v01/`-App nach Cutover-Welle W1.7 ab.

## Stack

- **Frontend + API**: Next.js 15 (App Router, TypeScript strict)
- **DB**: Postgres 16 (Docker auf IONOS-VPS) + Drizzle ORM
- **Auth**: Auth.js v5 (Magic-Link via Resend)
- **Ingestion (W2+)**: Python 3.12 + Scrapy (isolierter Container)
- **Deploy**: Docker-Compose, IONOS-VPS, nginx-Reverse-Proxy

Bindende ADRs: [034](../docs/adr/034-backend-pivot.md), [035](../docs/adr/035-postgres-choice.md), [036](../docs/adr/036-stack-ts-python.md), [037](../docs/adr/037-cutover-strategy.md), [038](../docs/adr/038-ingestion-architecture.md).

## Verzeichnisse

- `web/` — Next.js 15 App (Frontend + API-Routes + Editorial-CMS unter `/admin`)
- `db/` — Drizzle-Schemas + Migrations + DB-Skripte
- `infra/` — Docker-Compose, nginx-Config, Deploy-Skripte
- `ingest-py/` — Python-Scrapy-Worker (ab Welle W2)

## Setup (lokal)

Voraussetzungen: Node 24+, pnpm 9+, Docker.

```bash
cd v02
pnpm install
cp .env.example .env  # Werte ausfüllen
docker compose -f infra/docker-compose.yml up -d postgres
pnpm db:push          # Drizzle-Schema → lokale Postgres syncen
pnpm dev              # Next.js Dev-Server auf http://localhost:3000
```

## Skripte

- `pnpm dev` — Next.js Dev-Server
- `pnpm build` — Production-Build
- `pnpm typecheck` — TypeScript strict check
- `pnpm db:push` — Drizzle-Schema → DB (Dev-Workflow)
- `pnpm db:generate` — Drizzle-Migration-File generieren (Production)
- `pnpm db:migrate` — Migrations gegen DB anwenden (Production)

## Welle-Status

| Welle | Inhalt | Status |
|---|---|---|
| W1.1 | Foundation: Skeleton + Drizzle-Schema + Docker-Compose | im Bau |
| W1.2 | JSON-Daten → Postgres-Seed + Fakten-Pool | offen |
| W1.3 | Public-Frontend aus Stitch-User-ZIP | offen |
| W1.4 | Auth.js + Magic-Link + Registrierung | offen |
| W1.5 | Haushalts-Profil + Modus-Switcher | offen |
| W1.6 | Editorial-CMS (`/admin`) | offen |
| W1.7 | IONOS-Deploy + Hard-Cutover | offen |
| W2.1+ | Python-Scrapy-Ingestion + Notifications | später |

## Disziplin

- Code in TypeScript strict. Python nur in `ingest-py/` ab W2.
- DSGVO: keine PII in tracked Files. Lokale `.env` für Secrets.
- Deutsche UI durchgängig. Code-Identifier englisch.
- Sachlich, ruhig, nicht alarmistisch (siehe `../docs/brand.md`).
