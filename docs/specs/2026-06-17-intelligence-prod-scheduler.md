# Spec: Intelligence Prod Scheduler Hardening

## Ziel
Die Intelligence-Pipeline kann produktiv geplant laufen, ohne FK-Fehler fuer nicht angelegte Indikatoren oder wiederholte Vertex-Credential-Fehler zu erzeugen.

## Umfang / Nicht-Umfang
- In Scope: unknown-indicator skip in DB writes, Vertex credential guard, prod Compose overlay mit read-only secrets mount, Deploy-Doku.
- Out of Scope: neue oeffentliche DWD-/Pegel-Schwellen, DB-Migrationen, Web-Rebuild.

## Definition of Done
- [ ] Unknown `indicator_id` fuehrt zu sauberem Skip ohne Observations, Sources oder Audit-Log.
- [ ] Fehlende/Placeholder/nicht lesbare `GOOGLE_APPLICATION_CREDENTIALS` stoppen LLM vor Vertex-Init.
- [ ] Quota exhaustion erzeugt nach Retry-Limit einen per-run Skip statt weiterer Retry-Kaskaden.
- [ ] Prod-Overlay mountet `/opt/wachsam/secrets` read-only.
- [ ] Tests gruen: `cd v02/intelligence && python -m pytest tests/ -q`, `bash scripts/verify.sh`, `cd v02 && pnpm run verify`.

## Verify
1. Targeted Python tests fuer DB und LLM.
2. Voller Python-Testlauf.
3. Root-Verify und v02-Verify.
4. Prod dry-run mit mounted credentials.
5. Prod real run ohne `[DB] Insert failed`.

## Rollback
- Scheduler stoppen: `docker compose -f /opt/wachsam/v02/infra/docker-compose.intelligence.prod.yml down`.
- Vorherige One-off Image-Route bleibt nutzbar: `wachsam-intelligence:14fbaf3`.
- Keine Migration erforderlich.
