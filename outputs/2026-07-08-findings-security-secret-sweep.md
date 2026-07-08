# Security Secret Sweep — 2026-07-08

## Scope

- Repo: `C:\Users\jeans\workspace\Ruhrlogik\projects\WachSam-Krisenradar`
- Branch: `main`
- Sweep-Typ: wöchentlicher Secret-/PII-/OWASP-Kurzsweep
- Kein Commit, kein Push, keine Source-Code-Änderung

## Repo-Status

- `git status --short --branch`: `main...origin/main`
- Untracked: `outputs/archive/`, `outputs/daily-monitor-2026-07-08.md`

## Secret- und Config-Check

- Kein Hinweis auf committed `.env`, private Keys, Tokens oder Credential-Dateien in tracked Files.
- Root-[`.gitignore`](C:/Users/jeans/workspace/Ruhrlogik/projects/WachSam-Krisenradar/.gitignore) ignoriert `.env`, `*.pem`, `*.key`, `*.p12`, `application_default_credentials.json`, `wachsam-intelligence-key.json`.
- [`v02/.gitignore`](C:/Users/jeans/workspace/Ruhrlogik/projects/WachSam-Krisenradar/v02/.gitignore) ignoriert lokale Env-Dateien für `v02`.
- Lokale Datei `v02/intelligence/.env` existiert und enthält echte lokale Credentials, ist aber via `v02/.gitignore` korrekt untracked/ignored.
- Regex-Sweep auf offensichtliche AWS/GitHub/OpenAI/Slack-Tokens, private-key-Header und credentialhaltige DB-URLs ergab keine committed Treffer.
- Untracked Outputs `outputs/daily-monitor-2026-07-08.md` und `outputs/archive/full-audit-2026-07-07.md` zeigten in einem Kurzscan keine offensichtlichen Secret-/E-Mail-Treffer.

## Verify-Gates

- `bash scripts/verify.sh`: PASS
- `cd v02/intelligence && python -m pytest tests/ -q`: PASS (`230 passed, 3 skipped, 11 deselected`)
- `cd v02 && pnpm run verify`: BLOCKED
  - erster Lauf ohne TTY an `pnpm`-Purge-Prompt abgebrochen
  - reproduzierbarer Zweitlauf mit `CI=true` blockiert an `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`
  - aktive Runtime: `pnpm 11.7.0`
  - Repo erwartet laut [`v02/package.json`](C:/Users/jeans/workspace/Ruhrlogik/projects/WachSam-Krisenradar/v02/package.json) `pnpm@9.15.0`

## Findings

### Medium — Freiwillige Kontakt-E-Mail wird als PII persistent gespeichert

Status im Fix-Branch `fix/feedback-pii-minimization`: wird durch `docs/specs/2026-07-08-feedback-pii-minimization.md` und die zugehoerige Drizzle-/Web-Umsetzung behoben. Die folgenden Angaben dokumentieren den urspruenglichen Fund auf `main`.

- Pfade:
  - [`v02/web/lib/feedback.ts`](C:/Users/jeans/workspace/Ruhrlogik/projects/WachSam-Krisenradar/v02/web/lib/feedback.ts)
  - [`v02/web/app/api/feedback/route.ts`](C:/Users/jeans/workspace/Ruhrlogik/projects/WachSam-Krisenradar/v02/web/app/api/feedback/route.ts)
  - [`v02/db/schema/index.ts`](C:/Users/jeans/workspace/Ruhrlogik/projects/WachSam-Krisenradar/v02/db/schema/index.ts)
- Evidenz:
  - `feedback.ts:24,55-67` akzeptiert und normalisiert `contactEmail`
  - `route.ts:60-70` persistiert `contactEmail` zusammen mit optionaler `userId`
  - `schema/index.ts:524-531` definiert `contact_email` in der Tabelle `feedback`
- Risiko:
  - verletzt die Repo-Leitplanke `Keine PII in Datenbanken`
  - erhöht DSGVO-/Retention-/Access-Control-Aufwand für eine optionale Rückfragefunktion
- Empfohlene Aktion:
  - `contactEmail` nicht persistieren; stattdessen weglassen oder in einen separaten, klar geregelten Support-/Inbox-Flow auslagern
  - falls fachlich unvermeidbar: explizite Einwilligung, harte Retention, Verschlüsselung at rest, Löschpfad und Admin-Need-to-know erzwingen

### Low — Middleware akzeptiert Cookie-Präsenz statt verifizierter Session

- Pfad:
  - [`v02/web/auth.config.ts`](C:/Users/jeans/workspace/Ruhrlogik/projects/WachSam-Krisenradar/v02/web/auth.config.ts)
- Evidenz:
  - `auth.config.ts:3-9` prüft nur Cookie-Namen
  - `auth.config.ts:23-30` erlaubt `/profil`, `/admin`, `/review` schon bei `sessionCookiePresent`
- Risiko:
  - kein bestätigter Privilege-Escalation-Bug, weil Server-Layer zusätzlich `auth()` und `requireEditorRole()` erzwingt
  - aber inkonsistente Auth-Grenze; abgelaufene oder ungültige Cookies können Protected Routes weiter erreichen als nötig
- Empfohlene Aktion:
  - Middleware nur bei verifizierter Session bzw. passender Rolle passieren lassen
  - Cookie-Präsenz nicht als Auth-Signal verwenden

### Low — Security-Gate `pnpm run verify` ist aktuell toolchain-fragil

- Pfad:
  - [`v02/package.json`](C:/Users/jeans/workspace/Ruhrlogik/projects/WachSam-Krisenradar/v02/package.json)
- Evidenz:
  - `package.json:6` pinnt `pnpm@9.15.0`
  - `package.json:46-48` nutzt `pnpm.overrides`
  - laufende Runtime ist `pnpm 11.7.0`, das diese Konfiguration nicht mehr gleich behandelt; `verify` blockiert vor den eigentlichen Checks
- Risiko:
  - Security-/Quality-Gate ist in Automation nicht verlässlich ausführbar
  - Dependency-/Lockfile-Drift kann ungeprüft bleiben
- Empfohlene Aktion:
  - Automation/CI auf `pnpm@9.15.0` pinnen oder Workspace sauber auf `pnpm 11` migrieren
  - danach Lockfile gezielt neu erzeugen und `pnpm run verify` erneut absichern

## Kurzfazit

- Kein akuter committed Secret-Leak gefunden.
- Ein echter DSGVO-/PII-Befund liegt in der Feedback-Persistenz vor.
- Ein Auth-Härtungsfund liegt im Middleware-Gate vor.
- Das zentrale `v02`-Verify ist derzeit als Automations-Gate nicht stabil genug.
