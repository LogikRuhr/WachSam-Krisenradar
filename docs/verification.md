# Verification — WachSam v0.1 + v0.3

> Was vor jedem "fertig"-Claim verifiziert werden muss.

## Minimal-Verify

Aus `CLAUDE.md` Pflichtregel 4 ist `scripts/verify.sh` das primäre Verify-Gate:

```bash
scripts/verify.sh
```

Das Script zeigt die lokale Runtime-Umgebung und ruft in `v01/` `npm run typecheck`, `npm run build` und `npm test` auf. Alle drei Schritte müssen PASS sein. Ohne PASS gibt es keinen "fertig"-Claim und keinen Commit. Wenn das Repo unter WSL auf `/mnt/c/...` liegt, delegiert der Wrapper bewusst an Windows-`npm.cmd`, damit Windows- und WSL-native `node_modules` nicht vermischt werden.

## UI-Verify

Zusätzlich für jede Änderung an `v01/src/components/`, `v01/src/data/` oder `v01/src/index.css`:

```bash
cd v01
npm run smoke:ui
```

Der Smoke startet Vite über repo-lokales Playwright auf `http://127.0.0.1:5173` und prüft Desktop sowie Mobile Chromium. `npm run smoke:ui` nutzt `v01/scripts/smoke-ui.mjs`, setzt den Browser-Cache auf einen plattformspezifischen Cache unter `v01/.cache/ms-playwright-<platform>-<arch>`, installiert Chromium bei fehlendem Browser mit begrenztem Timeout und prüft den Chromium-Start vor dem Test, ohne globale Playwright-, Chrome- oder `/home/jeans/.hermes`-Caches zu verwenden. Wenn das Repo unter WSL auf `/mnt/c/...` liegt und Windows-`npm.cmd` erreichbar ist, delegiert der Wrapper früh an Windows-`npm.cmd`; die Windows-Runtime läuft zuerst durch `npm run dev:checked` und wird bei Rollup-Native-Fail durch Installation des in `package-lock.json` gepinnten optionalen Windows-Pakets `@rollup/rollup-win32-x64-msvc` mit `npm.cmd install --include=optional --no-save` repariert, bevor `npm run dev:checked` erneut läuft.

1. Seite lädt ohne Fehler.
2. „Heute relevant für Haushalte" steht vor „Lagebild Deutschland".
3. „Evidenzspur" ist sichtbar.
4. Source-Pills laufen nicht horizontal über.
5. Keine horizontale Scrollbar entsteht.
6. Browser-Console und Page-Errors sind clean.

Beim ersten Setup oder nach Browser-Cache-Cleanup:

```bash
cd v01
npm run smoke:ui:install
```

Keine globalen Playwright- oder Chrome-Pfade verwenden. `npm run smoke:ui:install` nutzt denselben repo-lokalen Wrapper und denselben Browser-Cache wie `npm run smoke:ui`. Wenn `npm run smoke:ui` mit `[runtime] Missing ...` abbricht, wurde `v01/node_modules` sehr wahrscheinlich zwischen Windows und WSL gemischt. Dann `v01/node_modules` entfernen und `npm ci` in derselben Runtime ausführen, in der auch der Smoke laufen soll.

Vom Repo-Root kann derselbe Smoke ohne manuelles `cd` gestartet werden:

```bash
bash scripts/smoke-ui.sh
```

## Bundle-Awareness

`npm run build` druckt die Bundle-Größen. Aktueller Stand v0.1: ca. 75 kB gzip total.

Erwartung:

- Patch-Änderungen an Daten oder UI: keine signifikante Bundle-Bewegung.
- Neue Dependencies: Bundle-Sprung in Größenordnung der Dependency. Bei mehr als +10 kB gzip nach einer einzelnen Änderung Begründung in den Commit-Body.
- Bundle-Schwellen sind aktuell kein CI-Gate. Auffällige Sprünge werden im Review begründet.

## Verify-Skript

`scripts/verify.sh` ist der lokale Wrapper:

```bash
scripts/verify.sh
```

Verhalten: `set -euo pipefail`, druckt `uname -a`, ruft in `v01/` `npm run typecheck`, `npm run build` und `npm test` auf und reicht Exit-Codes weiter. Der Node-24-Check liegt in `v01/scripts/check-runtime.mjs` und läuft mindestens vor `npm run build`, `npm run dev` und `npm run smoke:ui`.

## Was Verify NICHT abdeckt (in v0.1)

- Vollständige E2E-Flows über den UI-Smoke hinaus.
- Lighthouse, Accessibility-Scanner — manuell empfohlen, nicht automatisiert.
- Visual-Regression — manuell, nicht automatisiert.
- E2E-Tests mit authentifizierten Routen — erst ab v0.3/W1.4+ (Auth-Layer eingebaut).

## Verify-vor-fertig-Claim

Eine Aufgabe ist erst "fertig", wenn alle für den Scope relevanten Verify-Schritte PASS sind. "Fertig"-Claim ohne Belege ist verboten.

Bei Mehrschritt-Aufgaben:

- Nach jedem Schritt: Minimal-Verify.
- Nach UI-Änderung: zusätzlich UI-Verify.
- Vor Commit: `git status --short`, `git diff --staged --name-only` und `git diff --staged --stat` zeigen.

## Wenn Verify failt

1. Fehler lesen, Ursache verstehen.
2. Fix in einem klaren, kleinen Schritt.
3. Verify erneut.
4. Erst dann Commit.

Nie `--no-verify`. Nie Hooks deaktivieren, um durch zu kommen.

## v0.3-Verify-Erweiterungen (ab W1.1)

Mit dem Backend-Pivot (ADR-034 ff.) und dem `v02/`-Layout (Next.js 15, Postgres 16, Drizzle, Auth.js v5) kommen folgende Verify-Schritte für `v02/`-Edits dazu. Sie ergänzen das v0.1-Minimal-Verify oben — sie ersetzen es nicht, solange `v01/` als Static-Reference im Repo lebt.

### Minimal-Verify v0.3 (für `v02/`-Edits)

```bash
cd v02
pnpm install
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run db:generate
pnpm run db:seed:dry
pnpm run test:audit
```

Alle Schritte müssen PASS sein, bevor ein `v02/`-Edit „fertig" ist.

### Browser-Smoke v0.3

Für Änderungen an öffentlichen `v02/web/app/**`-Routen, Navigation oder globalem CSS:

```bash
cd v02
pnpm run smoke:ui:install
pnpm run smoke:ui
```

Der Smoke startet Next.js lokal auf `127.0.0.1:3100` und setzt bewusst keine `DATABASE_URL`.
Eine fehlende lokale DB darf als Entwicklungs-Hinweis erscheinen; Browser-Console-Fehler, Page-Errors, HTTP-5xx und horizontaler Overflow auf Desktop oder Mobile sind Failures.

### DB-Migration-Check

Vor jedem Edit am Drizzle-Schema oder an Migrationsdateien:

```bash
cd v02
pnpm run db:migrate:check
```

Der Check prüft, ob das laufende DB-Schema gegen `v02/db/schema.ts` driftfrei ist und ob alle Migrationen sauber durchlaufen. Drift ist Merge-Blocker.

Für CI- und Docker-Smokes läuft zusätzlich gegen Postgres:

```bash
cd v02
pnpm run db:migrate
pnpm run db:seed
```

### Editorial-API-Smoke (ab W1.6+)

Sobald die Editorial-Endpoints (Approve, Reject, Publish) live sind, läuft ein dedizierter Smoke gegen Test-DB-Seed:

```bash
cd v02
pnpm run smoke:editorial
```

Der Smoke validiert die Approval-Pipeline: Draft → Approve → Publish und prüft, dass unpublished Inhalte nicht über die Public-API sichtbar sind.

### Auth-Endpoints-Smoke (ab W1.4+)

```bash
cd v02
pnpm run smoke:auth
```

Validiert Magic-Link-Versand (Resend-Mock im Test-Modus), Session-Cookie-Setting und geschützte Routen.

### Intelligence-Pipeline-Verify (ab W2.1+)

```bash
cd v02/intelligence
pip install -r requirements.txt
python -m pytest tests/ -v
```

Prüft:

- Pydantic-Schema-Validierung für `IngestionItem` und `GermanyRelevance`
- Adapter-Mock-Tests (FAO, BNetzA, Destatis) gegen fixturierte Responses
- LLM-Extractor-Output gegen Pflicht-Output-Schema
- Forbidden-Language-Gate gegen alarmistisches Vokabular

Kein Test gegen Live-Endpoints oder echte Vertex-AI-Calls in CI. LLM-Tests laufen gegen Mock-Responses.

### Was v0.3-Verify NICHT abdeckt

- Live-Ingestion-Adapter-Tests gegen echte externe Quellen — die laufen ab W2+ separat und mit Mocks.
- Produktions-DB-Daten — Verify läuft ausschliesslich gegen lokale Test-DB.
- Lasttests — nicht Teil des Standard-Verify, ab W2+ separat.
- Live-Vertex-AI-Calls — nur Mock-Tests in CI.
