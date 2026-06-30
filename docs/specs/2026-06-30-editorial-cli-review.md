# Spec: Editorial CLI Review

## Ziel
WachSam-Drafts koennen ohne Login/Admin-UI per Operator-CLI gesichtet, als Markdown reportet und ueber bestehende Editorial-Statusregeln freigegeben, publiziert oder abgelehnt werden.

## Umfang / Nicht-Umfang
- In Scope: `editorial:queue`, `editorial:report`, `editorial:approve`, `editorial:publish`, `editorial:reject`.
- Out of Scope: neues DB-Schema, Admin-Bootstrap, Passwort-Login, Auto-Publish fuer Lageeinschaetzungen.

## Acceptance
- Queue zeigt `draft` und `approved` sortiert nach Status und Eingang/Review-Zeit.
- Report erzeugt Markdown in `outputs/` oder an einem expliziten `--out`-Pfad.
- `approve` geht nur `draft -> approved`.
- `publish` geht nur `approved -> published`.
- `reject` geht nur aus `draft`/`approved` und verlangt `--reason`.
- Jede Mutation schreibt Audit-Log; `actor_id` bleibt null, `editorial_reviewed_by` ist `ops-cli`.
- CLI gibt keine E-Mail-Adressen aus und benoetigt keine Auth-Session.

## Verify
- `bash scripts/verify.sh`
- `cd v02 && corepack pnpm run verify`
- `cd v02/intelligence && python -m pytest tests/ -q`
- `cd v02 && corepack pnpm run editorial:queue`
- `cd v02 && corepack pnpm run editorial:report -- --out outputs/editorial-review-smoke.md`

## Rollback
Commit revert. Keine Migration noetig.
