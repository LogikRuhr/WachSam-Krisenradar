# Deploy

## Ziel

Dieses Repo ist die kanonische Quelle fuer Struktur, Workflows, Templates und Doku.
Der Deploy legt den aktuellen `main`-Stand auf dem VPS unter `/opt/wachsam/source` ab.

Der Deploy startet keine Container neu und ueberschreibt nicht die laufende Produktion unter
`/opt/wachsam/current`, `/opt/wachsam/v02` oder `/opt/wachsam/docker-compose*.yml`.

Ausnahme: `v02/infra/docker-compose.intelligence.prod.yml` ist ein Runtime-Overlay fuer die
Intelligence-Pipeline. Es wird erst nach Source-Promote auf dem VPS manuell per Docker Compose
genutzt und ist nicht Teil des GitHub-Source-Deploys.

## GitHub Secrets

Erforderlich:

- `VPS_HOST` - `85.215.213.110`
- `VPS_USER` - `root`
- `VPS_SSH_KEY` - private SSH key fuer den Deploy-Zugang
- `VPS_APP_DIR` - `/opt/wachsam/source`

Nicht erforderlich fuer diesen Source-Deploy:

- `.env`
- API keys
- Datenbank-Credentials
- Service Tokens

Produktive `.env`-Werte werden erst als GitHub Secrets gesetzt, wenn ein Runtime-Stack in diesem
Repo liegt und eine Spec den Bedarf begruendet.

Vertex-AI-Credentials bleiben auf dem VPS unter `/opt/wachsam/secrets/` und werden im
Intelligence-Overlay nur read-only gemountet. Der Key wird nie in Git, Images oder GitHub
Artifacts abgelegt.

Lokal kann die Intelligence-Pipeline entweder Google ADC nutzen (`gcloud auth
application-default login`, dann `GOOGLE_APPLICATION_CREDENTIALS` leer lassen) oder ein
Service-Account-Keyfile ausserhalb des Repos referenzieren, z.B.
`%USERPROFILE%\.config\wachsam\secrets\wachsam-intelligence-key.json`.
Prod bleibt beim expliziten Secret-Mount:
`GOOGLE_APPLICATION_CREDENTIALS=/opt/wachsam/secrets/wachsam-intelligence-key.json`.

Fuer Vertex AI / Google Gen AI nutzt WachSam aktuell den live geprueften Default
`GEMINI_MODEL_NAME=gemini-3.5-flash` mit `VERTEX_AI_LOCATION=global`.
Ein lokaler Smoke am 2026-06-25 zeigte fuer `gemini-3.5-flash` in `europe-west3`
einen `404 NOT_FOUND`; `global` antwortete erfolgreich.

## Ablauf

1. `verify` Workflow muss auf `main` gruen sein.
2. `deploy-source` wird manuell per `workflow_dispatch` gestartet.
3. GitHub Actions verbindet per SSH auf den VPS.
4. `scripts/deploy-source.sh` klont oder aktualisiert `/opt/wachsam/source`.
5. Das Script checkt exakt den Commit aus, der den Workflow gestartet hat.
6. Auf dem VPS laeuft `bash scripts/verify.sh`.
7. `.deploy-state` dokumentiert Commit, Zeit und Zielpfad.

## Smoke

Nach Deploy:

```bash
ssh -i ~/.ssh/wachsam_deploy root@85.215.213.110 'cd /opt/wachsam/source && git rev-parse --short HEAD && bash scripts/verify.sh'
```

Erwartung:

- Commit entspricht dem GitHub Actions Head SHA.
- Verify meldet `verify: PASS`.
- Produktive Container laufen unveraendert weiter.

## Editorial CLI auf Produktion

Der Review-Pfad braucht keinen Admin-Login. Im Runtime-Container:

```bash
docker exec wachsam-web sh -lc 'cd /app && ./node_modules/.bin/tsx scripts/editorial-cli.ts queue --limit 20'
docker exec wachsam-web sh -lc 'cd /app && ./node_modules/.bin/tsx scripts/editorial-cli.ts report --out outputs/editorial-review.md'
docker exec wachsam-web sh -lc 'cd /app && ./node_modules/.bin/tsx scripts/editorial-cli.ts approve lagebildItems <id>'
docker exec wachsam-web sh -lc 'cd /app && ./node_modules/.bin/tsx scripts/editorial-cli.ts publish lagebildItems <id>'
```

Fuer Ablehnung:

```bash
docker exec wachsam-web sh -lc 'cd /app && ./node_modules/.bin/tsx scripts/editorial-cli.ts reject lagebildItems <id> --reason "Quelle unklar"'
```

Die CLI liest `DATABASE_URL` aus der bestehenden Container-Umgebung und schreibt keine Secrets oder User-E-Mails in den Output.

## Rollback

Source-Rollback auf dem VPS:

```bash
cd /opt/wachsam/source
git fetch origin main
git checkout --detach <previous-good-sha>
bash scripts/verify.sh
```

Intelligence-Scheduler stoppen:

```bash
cd /opt/wachsam/v02/infra
docker compose -f docker-compose.intelligence.prod.yml down
```
