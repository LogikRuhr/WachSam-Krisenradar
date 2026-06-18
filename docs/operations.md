# Betrieb & Wartung

Kurz-Runbook für Routinen, Monitoring und Updates. Simply First — native Tools, keine Zusatz-Frameworks.

## Monitoring
- **Health-Endpoint:** `GET /api/health` → `{ status, db, ts }`. `200` = ok, `503` = degraded (DB nicht erreichbar). Keine Secrets/Details.
- **Externer Uptime-Check:** UptimeRobot (o. ä.) alle 5 Min auf `https://wachsam.ruhrlogik.de/api/health`, Alarm bei ≠ 200.
- **Datenaktualität:** öffentliche Seite `/status` zeigt je Quelle Status (fresh/stale/error …) und letzten Erfolg aus `source_health`. Rohe Fehlertexte bleiben intern.
- **Postgres:** Healthcheck `pg_isready` ist im Compose aktiv.

## Updates / Dependencies
- **Dependabot** (`.github/dependabot.yml`): wöchentlich (Mo) für npm (`/v02`), pip (`/v02/intelligence`), github-actions. Minor/Patch gruppiert.
- **Vorgehen:** Dependabot-PR → CI (`verify.yml`) muss grün → Review → Merge. Major-Updates einzeln und manuell prüfen.
- **Lockfiles/Manifeste** sind maßgeblich (`pnpm-lock.yaml`, `requirements.txt` bzw. `pyproject.toml`).

## Verify-Gates (vor jedem Merge)
- `bash scripts/verify.sh` (Secrets/Status) · `cd v02 && pnpm run verify` (tsc/eslint/build/seed-dry-run/Unit-Tests) · `cd v02/intelligence && python -m pytest tests/ -q`.

## Deploy (Mensch-Domäne, DB-Deny)
- Live-Stack: `/opt/wachsam/docker-compose.v02.yml` (Build-Context `/opt/wachsam/v02`); Intelligence: `docker-compose.intelligence.prod.yml` (`INGESTION_MODE=scheduled`).
- Reihenfolge: Code ziehen → **Migration anwenden** (`pnpm db:migrate`) → Rebuild (`docker compose … up -d --build web`).
- DB-Schreibzugriff (psql, `drizzle-kit migrate/push`, seed) führt **nur der Mensch** aus.

## Backup / Restore
- Postgres regelmäßig sichern (`pg_dump`), Restore vor jedem riskanten Migrationsschritt testen. (Backup-Automatisierung: offener Folgeschritt.)

## Offene Folgeschritte
- Error-Tracking (z. B. Sentry) optional; aktuell bewusst nicht eingebaut.
- Admin-User-Provisioning fehlt → CMS/Editorial-Freigaben aktuell nur via direkte DB.
