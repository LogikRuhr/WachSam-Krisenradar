# Testing — WachSam v0.1 + v0.3

> Test-Strategie für die statische v0.1-Homepage und den kontrollierten Seed-Datensatz.

## v0.1-Status

v0.1 hat eine fokussierte Vitest-Suite für Datenintegrität:

| Pfad | Zweck |
|---|---|
| `v01/tests/data-integrity.test.ts` | Prüft die fünf Seed-Daten-Files gegen Pflichtfelder, Enum-Werte, Quellen-URLs und eindeutige IDs. |

Die Qualitätsgates sind:

- `cd v01 && npm run typecheck` — TypeScript-Strict-Modus
- `cd v01 && npm run build` — Vite-Build
- `cd v01 && npm test` — Data-integrity Tests
- `cd v01 && npm run smoke:ui` — Browser-Smoke bei UI-Änderungen
- Manueller UI-Check im Browser bei UI-Änderungen (siehe `docs/verification.md`)

## CI

`.github/workflows/v01-ci.yml` läuft auf Push und Pull Request gegen `main` sowie manuell über `workflow_dispatch`.

Pipeline:

1. `npm ci`
2. `npm run typecheck`
3. `npm run build`
4. `npm test`

Kein Deploy.

## UI-Smoke

Der reproduzierbare Browser-Smoke läuft repo-lokal über Playwright:

```bash
cd v01
npm run smoke:ui:install
npm run smoke:ui
```

`npm run smoke:ui` startet Vite über `playwright.config.ts` auf `127.0.0.1:5173` und prüft Desktop Chromium sowie Mobile Chromium. Der Befehl läuft über `v01/scripts/smoke-ui.mjs`; der Wrapper nutzt die repo-lokale Playwright-CLI, setzt `PLAYWRIGHT_BROWSERS_PATH` auf einen plattformspezifischen Cache unter `v01/.cache/ms-playwright-<platform>-<arch>`, installiert Chromium bei fehlendem Browser mit begrenztem Timeout, prüft den Chromium-Start vor dem Test und setzt `CI=1` nur für den Playwright-Prozess, damit kein bestehender lokaler Server wiederverwendet wird. Der Test validiert, dass „Heute relevant für Haushalte" vor „Lagebild Deutschland" steht, „Evidenzspur" sichtbar ist, Source-Pills nicht horizontal überlaufen, keine horizontale Scrollbar entsteht und keine Console- oder Page-Errors auftreten.

Wenn das Repo unter WSL auf `/mnt/c/...` liegt und Windows-`npm.cmd` erreichbar ist, delegiert `v01/scripts/smoke-ui.mjs` früh an Windows-`npm.cmd`, damit Windows und WSL nicht dasselbe `node_modules` oder denselben Browser-Cache mischen. Ohne verfügbare Windows-Delegation prüft der Wrapper lokal über `v01/scripts/check-runtime.mjs` Node 24 und die passende Rollup-Native-Dependency für die aktuelle Plattform. Die delegierte Windows-Runtime läuft zuerst durch `npm run dev:checked`; bei Rollup-Native-Fail installiert der Wrapper einmalig das in `package-lock.json` gepinnte optionale Windows-Paket `@rollup/rollup-win32-x64-msvc` mit `npm.cmd install --include=optional --no-save` und führt danach `npm run dev:checked` erneut aus. Install-, Delegations- und Playwright-Schritte sind zeitlich begrenzt. Smoke-Tests werden nicht über globale Playwright-, Chrome- oder `/home/jeans/.hermes`-Browser-Caches gestartet.

Vom Repo-Root nutzt `bash scripts/smoke-ui.sh` denselben Smoke-Weg. Liegt das Repo unter WSL auf `/mnt/c/...`, delegiert der Wrapper an Windows-`npm.cmd`, damit nicht aus Versehen Linux- und Windows-native Dependencies im selben `node_modules` vermischt werden.

### Was die Datenintegritäts-Tests prüfen

Pro Seed-Datei in `v01/src/data/`:

1. **Pflichtfelder** — jedes Item enthält alle Felder, die der UI-Standard verlangt (Bereichs-Label, Severity oder Zeithorizont, Titel, Beschreibung, Confidence-Stufe, mindestens eine Quelle).
2. **Enum-Werte** — Severity nur aus `{stabil, beobachten, erhöht, kritisch}`. Confidence nur aus `{niedrig, mittel, hoch}`. Zeithorizont nur aus `{kurzfristig, wochen, monate, langfristig}`. Bereichs-Label nur aus den zehn definierten Systembereichen.
3. **Quellen-URLs** — beginnen mit `https://`, lassen sich als URL parsen, kein leerer String.
4. **Stand-Felder** — vorhanden und nicht leer. Das aktuelle Gate validiert kein Datums- oder Monatsformat.
5. **Unique IDs** — IDs in jeder Datei eindeutig.

Bei Fehlschlag bricht CI. Falsche Daten dürfen nicht ins Repo.

## Source-Liveness (G3 advisory)

`v01/scripts/check-source-urls.mjs` prüft alle `sources[].url`-Werte aus den JSON-Datasets in `v01/data/` (ohne `forbidden-words.json` und `schemas/`) gegen HTTP — HEAD zuerst, GET-Fallback bei `403/405/429/501`. Ergebnisse werden in `v01/.cache/url-liveness.json` (gitignored) mit 24 h TTL gecached.

```bash
cd v01
npm run check:sources
```

Per ADR-028 ist G3 in v0.1 **advisory**. Das Script gibt einen gruppierten Bericht aus und beendet sich mit Exit 0, auch bei `warn`- oder `fail`-Treffern. Non-zero nur bei Script-Crash oder ungültigem JSON. Es gibt kein CI-Gate, keinen Scheduler und kein Runtime-Polling — der Lauf ist manuell und redaktionell zu interpretieren.

## Was in v0.1 NICHT kommt

- Vollständige End-to-End-Suiten über den UI-Smoke hinaus.
- Visual-Regression (Percy, Chromatic).
- Unit-Tests für Components — die UI ist statisch und ohne Logik, Tests wären leer.
- Snapshot-Tests — bringen für eine statische Single-Page-App keinen Mehrwert.
- Performance-Budgets als CI-Gate — Bundle-Awareness läuft manuell (`docs/verification.md`).

## Test-Run-Konvention

Lokaler Testlauf:

```bash
cd v01
npm test
```

`scripts/verify.sh` ruft die Tests nach `typecheck` und `build` auf.

## Wann Tests dazukommen

Weitere Tests kommen nur bei konkretem Risiko dazu. Live-Daten ohne Datenintegritäts-Gate sind verboten.

## v0.3 — Test-Strategie für Backend (ab W1.1, 2026-05-22)

Mit dem Backend-Pivot (ADR-034 ff.) und dem `v02/`-Layout (Next.js 15, Postgres 16, Drizzle, Auth.js v5) wird die Test-Strategie um eine Backend-Schicht erweitert. v0.1-Tests in `v01/` bleiben aktiv, solange `v01/` als Static-Reference im Repo lebt.

### Integration-Tests mit Postgres-Docker-Container

Ab W1.1 läuft die CI gegen einen Postgres-16-Docker-Container. Der aktuelle Stand führt Drizzle-Migrationen aus und seedingt den deterministischen Grundstock gegen die echte DB-Engine. Dedizierte Repository-/Service-Integrationstests kommen erst, sobald diese Schicht über reine Seed-/Read-Queries hinausgeht.

```bash
cd v02
pnpm run db:migrate
pnpm run db:seed
```

### DB-Migration-Tests

Jede neue Migration in `v02/db/migrations/` braucht mindestens `pnpm run db:generate`, `pnpm run db:migrate` und `pnpm run db:seed` gegen einen leeren Postgres-Container. Schema-Drift zwischen Code-Schema und Migration ist Merge-Blocker.

### Auth-Endpoint-Tests (ab W1.4+)

Auth.js-v5-Routen brauchen ab dem ersten geschützten User-Flow focused Tests oder Smokes für Magic-Link-Versand, Session-Cookie-Setting, CSRF-Schutz und geschützte Routen. Persona-frei — Test-User mit anonymisierten IDs, keine PII.

### Editorial-Approval-Workflow-Tests (ab W1.6+)

End-to-End-Tests der Editorial-Pipeline: Item-Draft anlegen, Approve, Publish, Reject, Unpublish. Pruefung der State-Transitions und der Sichtbarkeitsregeln (unpublished Items nicht in Public-API).

### Live-Ingestion-Adapter-Mock-Tests (W2+)

Jeder Python-Scrapy-Adapter in `v02/ingest-py/` bringt Mock-Tests mit, die gegen fixturierte HTTP-Responses laufen. Kein Test gegen Live-Endpoints in CI. Run-Log-Tests prüfen, dass jeder Adapter-Lauf ein vollständiges Run-Log mit Timestamp, Quelle und Item-Count schreibt.

### Intelligence-Pipeline-Tests (W2.1+, ADR-039)

Die Intelligence-Pipeline unter `v02/intelligence/` bringt eigene Python-Tests mit:

- **Adapter-Mock-Tests:** Jeder strukturierte Adapter (FAO, BNetzA, Destatis, WarningIndicators) wird gegen fixturierte HTTP-Responses getestet. Kein Test gegen Live-APIs in CI.
- **Pydantic-Schema-Tests:** `IngestionItem` und `GermanyRelevance` werden gegen gültige und ungültige Payloads getestet. Pflichtfelder `germany_relevance`, `methodology_tag`, `affected_systems` müssen vorhanden sein.
- **LLM-Extractor-Mock-Tests:** Vertex-AI-Calls werden gemockt. Output wird gegen das Pflicht-Output-Schema (`intelligence/output-schema.md`) validiert. Kein Live-Vertex-AI-Call in CI.
- **Forbidden-Language-Gate:** Tests prüfen, dass LLM-Output kein alarmistisches Vokabular enthält (siehe `docs/brand.md` §Was die Brand NICHT ist).

```bash
cd v02/intelligence
python -m pytest tests/ -v
```

### E2E mit Playwright + Test-DB-Seed

Der erste v0.3-Browser-Smoke läuft ohne DB-Secrets gegen öffentliche Routen:

```bash
cd v02
pnpm run smoke:ui
```

Er startet Next.js lokal über Playwright, prüft Startseite, Kernnavigation, mehrere öffentliche Routen, Browser-Fehler, HTTP-5xx und horizontalen Overflow auf Desktop und Mobile. Eine fehlende lokale DB ist in diesem Smoke erlaubt, solange die UI sauber degradet. Vollständige End-to-End-Tests mit geseedeter Test-DB bleiben für User-facing Flows ab Hard-Cutover-Vorbereitung Pflicht.

### CI-Matrix v0.3

CI läuft parallel zwei Pipelines, solange `v01/` und `v02/` koexistieren:

- `v01-ci.yml` — kombinierte Pipeline mit bestehendem statischem Job gegen `v01/` und Backend-Job gegen `v02/`
- `v02`-Job — Postgres-Container, Typecheck, Lint, Build, Drizzle-Generate, Seed-Dry-Run, Audit-Invariants, Migration+Seed-Smoke

Nach Hard-Cutover (W1.7) wird die `v01-ci.yml` deaktiviert; `v01/` bleibt als Static-Reference im Repo, läuft aber nicht mehr durch CI.
