---
adr: 037
title: v01-zu-v02 Hard-Cutover — v02 löst v01 unter Hauptdomain ab
status: accepted
date: 2026-05-22
accepted_date: 2026-05-22
superseded_date:
wave: W0
deciders: Jean Schütz
relates_to: 029, 034
supersedes: —
superseded_by: —
---

# ADR-037 — v01-zu-v02 Hard-Cutover

## Kontext

Mit dem Backend-Pivot (ADR-034) entsteht eine zweite App-Generation. Die Frage ist, wie der Übergang von der statischen `v01/`-App zur neuen `v02/`-App ablaufen soll: parallel auf Subdomains, Feature-Flag-Mischbetrieb oder Hard-Cutover.

### Bestandsaufnahme — Stand 2026-05-22

- `v01/` liefert die aktuelle Public-App unter der Hauptdomain (ausgespielt aus `v01/dist/` über den IONOS-VPS, siehe ADR-030).
- `archive/dashboard-pre-rebuild-2026-05-22` existiert als Backup-Branch für den State vor dem Pivot.
- Es gibt keine Live-Nutzerbasis mit persistenten Daten in `v01/` — die App ist read-only, ohne Auth, ohne Profile.
- IONOS-Deploy nutzt nginx-Static unter `/opt/wachsam/`, mit `try_files`-SPA-Fallback.

### Anforderungen

- Sauberer mentaler Schnitt: eine App ist die aktuelle.
- Keine Doppelpflege von Inhalten zwischen v01 und v02.
- Backup-Pfad bleibt erhalten (Branch + eingefrorenes Verzeichnis).
- Repo bleibt durchsuchbar — v01-Code wird nicht gelöscht, sondern eingefroren.
- Deploy-Pipeline kann beide gleichzeitig bedienen, bis Cutover vollzogen ist.

## Anwärter

### Option A — Hard-Cutover unter Hauptdomain

- `v02/` parallel zu `v01/` im selben Repo.
- `v01/` wird nach W0 eingefroren (README-Disclaimer, kein Code-Edit mehr).
- Sobald W1.7 deployt ist: nginx-Switch in `infra/ionos/nginx.conf`, Hauptdomain zeigt auf `v02/`.

### Option B — Subdomain-Parallelbetrieb

- `v01/` bleibt unter Hauptdomain, `v02/` läuft unter `next.wachsam.de` oder ähnlich.
- Migration in mehreren Schritten.
- Inhalts-Drift droht (v01 zeigt Stand-X, v02 zeigt Stand-Y).

### Option C — Feature-Flag-Mischbetrieb

- Eine App-Shell, Sections aus v01 oder v02 je nach Flag.
- Hoher Implementierungsaufwand für temporären Zustand.

## Bewertung

Skala: ✅ stark · ◐ akzeptabel · ⚠ schwach

| Kriterium | A (Hard-Cutover) | B (Subdomain) | C (Feature-Flag) |
|---|---|---|---|
| Sauberer mentaler Schnitt | ✅ | ⚠ | ⚠ |
| Inhalts-Doppelpflege vermieden | ✅ | ⚠ | ⚠ |
| Backup-Pfad erhalten | ✅ | ✅ | ◐ |
| Implementierungsaufwand | ✅ | ◐ | ⚠ |
| Risiko bei W1.7-Regressions | ◐ | ✅ | ✅ |
| Konsistenz für DACH-Nutzer | ✅ | ⚠ | ⚠ |

## Entscheidung

**Hard-Cutover.** `v02/` wird neben `v01/` im selben Repo angelegt. `v01/` wird nach Abschluss von W0 eingefroren (README-Disclaimer, keine Code-Edits mehr). `archive/dashboard-pre-rebuild-2026-05-22` bleibt remote-persistenter Backup-Branch. Sobald Welle W1.7 verifiziert deployt ist, wird in der IONOS-nginx-Konfiguration die Hauptdomain auf die `v02/`-Auslieferung umgestellt. Die Subdomain-Phase wird verworfen.

## Begründung

- **Sauberer Schnitt.** Ein konsistentes Mental-Modell für Nutzer und für die Doku. Keine „welche Version sehe ich gerade"-Verwirrung.
- **Keine Inhalts-Doppelpflege.** Sobald Editorial-Pflege in v02 läuft, wäre paralleler v01-Stand sofort veraltet. Hard-Cutover vermeidet, dass v01 zur „Schatten-Wahrheit" wird.
- **Repo bleibt lesbar.** `v01/` bleibt im Repo als Static-Reference. Code, Daten und Komponenten sind weiterhin durchsuchbar — nur nicht mehr live.
- **Backup-Disziplin bleibt erhalten.** Branch `archive/dashboard-pre-rebuild-2026-05-22` ist remote-persistent und immutable. Recovery-Pfad bleibt ein `git checkout` weit weg.
- **Niedrige Migrationskosten.** Keine Live-Nutzerbasis mit persistenten Daten — kein Migrationsplan für User-State nötig.
- **DACH-Konsistenz.** Eine Hauptdomain, eine App. Konsistent mit der Produkt-Direction (klar, ruhig, deutsch, nicht alarmistisch).

## Konsequenzen

- **Repo-Layout:** `v01/` (eingefroren) und `v02/` (aktiv) leben parallel unter dem Repo-Root.
- **`v01/README.md` bekommt nach W0 einen Disclaimer:** „eingefroren als Static-Reference; aktive Entwicklung läuft unter `v02/`".
- **`docs/repo-structure.md` bekommt einen `v02/`-Block** mit Sub-Tree (`web/`, `db/`, später `ingest-py/`).
- **IONOS-Deploy-Pipeline:** `infra/ionos/`-Artefakte und Runbooks decken sowohl `v01/`- als auch `v02/`-Pfade ab. Wechsel der Domain-Auslieferung erfolgt durch nginx-Config-Update, nicht durch Repo-Strukturänderung.
- **CI-Pipeline:** `.github/workflows/v01-ci.yml` bleibt für `v01/` aktiv (Typecheck, Build), zusätzlich entsteht `v02-ci.yml` für die neue App in W1.1.
- **Issue-Hygiene:** Alle neuen Issues laufen gegen `v02/`. `v01/`-Issues werden nur akzeptiert, wenn sie kritische Sicherheits- oder DSGVO-Probleme adressieren (Bug-Fix-Window während Cutover-Übergang).

**Implementierungsnotiz 2026-05-23:** Der v02-Check wurde nicht als separate Datei `v02-ci.yml` angelegt, sondern als zweiter Job im bestehenden Workflow `.github/workflows/v01-ci.yml`. Die Cutover-Entscheidung bleibt unverändert: `v01/` und `v02/` werden parallel geprüft, bis W1.7 den Hard-Cutover ausführt.
- **Cutover-Trigger:** nginx-Switch erst nach W1.7-Verify (Build PASS, Smoke PASS, manueller UI-Check PASS, Backup-Snapshot erstellt).
- **Backup-Branch-Disziplin:** `archive/dashboard-pre-rebuild-2026-05-22` ist read-only. Keine Force-Pushes, keine Deletes.

### Pfad-übergreifende Nicht-Konsequenzen

- Die Hauptdomain bleibt dieselbe — keine Subdomain-Migration.
- Keine User-Daten-Migration (es gibt keine).
- `v01/`-Code wird nicht gelöscht, sondern eingefroren. Git-Historie bleibt vollständig.
- ADR-029 (Git-Hygiene) bleibt unverändert; Branch- und Commit-Disziplin werden auch in W1+ angewendet.

## Risiken

- **Risiko:** W1.7-Cutover-Fenster zeigt Regressions, die in Staging nicht aufgefallen sind.
  - **Auswirkung:** Hauptdomain liefert kaputten Stand.
  - **Gegensteuerung:** Pre-Cutover-Snapshot des nginx-Configs, schneller Roll-back-Pfad (Config-Revert in unter einer Minute), v01-Container bleibt während der Cutover-Stunde online.
- **Risiko:** v01-Inhalte werden als „aktuelle Quelle" missverstanden, weil sie im Repo sichtbar bleiben.
  - **Auswirkung:** Doku- oder Daten-Konflikte zwischen v01 und v02.
  - **Gegensteuerung:** `v01/README.md`-Disclaimer, klare SoT-Doku-Sektion „v0.3 ist aktuell", Issue-Hygiene-Regel.
- **Risiko:** Repo wird durch Doppel-Bestand unübersichtlich.
  - **Auswirkung:** Neue Contributoren orientieren sich falsch.
  - **Gegensteuerung:** `docs/repo-structure.md` und `CLAUDE.md` werden in W0-Closeout aktualisiert; Top-Level-`README.md` zeigt klar auf `v02/`.

## Open Decisions

- Exaktes Cutover-Datum — wird mit W1.7-Verify-PASS fixiert.
- Ob `v01/` nach 90 Tagen post-Cutover gelöscht oder dauerhaft als Static-Reference behalten wird — wird in Welle W1.7-Closeout entschieden.

## Status

`accepted` seit 2026-05-22. v02-Layout entsteht in W1.1, Cutover in W1.7.

## Status-History

| Datum | Von | Nach | Auslöser |
|---|---|---|---|
| 2026-05-22 | — | accepted | User-Entscheidung Hard-Cutover im Rahmen Backend-Pivot W0 |
