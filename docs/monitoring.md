# Monitoring — WachSam

Zwei Schichten prüfen täglich, dass die öffentliche App (`wachsam.ruhrlogik.de`) gesund ist.

## 1. Primär: Daily Monitor (Codex)

- **Läuft über OpenAI Codex**, täglich ~08:00 Europe/Berlin. **Nicht** GitHub Actions, **nicht** Claude-Cloud-Routine, **nicht** Windows-Aufgabenplanung (alle geprüft und leer).
- Erzeugt `outputs/daily-monitor-YYYY-MM-DD.md` — **gitignored, lokal-only** (`.gitignore`: `outputs/daily-monitor-*.md`).
- Umfang je Lauf: Working-Tree-Check → Live-Smoke (`curl` + Playwright, Console-/Page-Errors, `/api/health`) → `bash scripts/verify.sh` + `cd v02 && pnpm verify` → Security/DSGVO-Note.

## 2. Backup: Claude Cloud Routine (Alerting-Schicht)

- Routine **`WachSam Daily Health Monitor (Backup)`** — ID `trig_01Um8tddfwj8CBS2VLTW5GzZ`, täglich **08:43 Europe/Berlin** (`43 6 * * *` UTC, versetzt nach dem Codex-Lauf), Modell `claude-sonnet-5`, Env `Ruhrlogik`.
- Unabhängiger Uptime-Check der öffentlichen Flächen. **Alarmiert bei FAIL** durch ein GitHub-Issue `[monitor] WachSam FAIL <Datum>` (robust ohne interaktiven MCP-Auth). Bei PASS still — kein Rauschen.
- Verwalten / manuell auslösen: https://claude.ai/code/routines/trig_01Um8tddfwj8CBS2VLTW5GzZ

## Was geprüft wird (nur öffentlich/anonym, keine PII)

- `GET /` → 200, H1 „Was betrifft meinen Haushalt jetzt?", Wochenblock „Diese Woche"
- `GET /lage` → 200, „Gesamtstand Deutschland"
- `GET /api/health` → 200, `{ status: ok, db: ok }`
- Codex zusätzlich: Working-Tree clean, `scripts/verify.sh` + `pnpm verify` grün, keine Console-/Page-Errors, kein horizontaler Overflow.

## Report-Vorlage (Codex daily-monitor)

Feste, scanbare Struktur mit **einer** maschinenlesbaren `Status:`-Zeile — damit Trends und Ausfälle ohne Volltext-Lesen erkennbar sind:

```
# Daily Monitor <YYYY-MM-DD>

Status: PASS | FAIL

- Git: <clean | dirty: Datei(en)>
- Live-Smoke: / -> <200, …ms>; /lage -> <…>; /api/health -> <…>
- Verify: scripts/verify.sh -> <PASS|FAIL>; v02 pnpm verify -> <PASS|FAIL>
- Sicherheit/DSGVO: <keine Secrets/PII; nur öffentliche Flächen + lokale Gates>
- Nächste Aktion: <konkret oder „keine">
```

Regel: `Status: FAIL`, sobald **irgendein** Teil-Check fehlschlägt (auch ein dirty Working Tree). Kein „Live"/„Echtzeit"-Wording (Verbotsliste, siehe `docs/brand.md`).

## Runbook

- Neuesten Report lesen: `ls -t outputs/daily-monitor-*.md | head -1`.
- Backup-Routine (Run-Historie, „Run now", enable/disable): Routine-Link oben. Löschen nur über https://claude.ai/code/routines.
- FAIL-Alarm = GitHub-Issue `[monitor] WachSam FAIL …` → im Repo sichtbar + per GitHub-Notification.
- Deploy/Live-Referenz für Fixes: `gh workflow run deploy.yml --ref main` (Auto-Promote); Details siehe VPS-Deploy-Referenz.

## Bekannte Lücken / Historie

- **2026-07-09:** Codex-Daily-Run ausgefallen (keine `daily-monitor-2026-07-09.md`), still und unbemerkt — Auslöser für die Backup-Alarm-Schicht oben.
- **07-11 bis 07-13:** wiederkehrender Git-`dirty`-Befund (`.gitignore`-Dublette + `outputs/source-health-*.md`); Ursache am 2026-07-13 behoben (`.gitignore`-Dublette verworfen, `source-health-*.md` ist via `.gitignore` ignoriert, Working Tree clean).
- Codex-Reports sind lokal-only → keine zentrale Historie. Die Backup-Routine deckt **Alerting** ab, nicht Historie. Optional später: PASS/FAIL in einen sichtbaren Kanal (n8n) spiegeln.
- `outputs/source-health-*.md` (separate Codex-Routine) läuft unregelmäßig (nur 07-03, 07-10) — separat prüfen, falls die Quellen-Health-Überwachung verbindlich sein soll.
