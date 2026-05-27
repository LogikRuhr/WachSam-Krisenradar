---
adr: 034
title: Backend Pivot — WachSam bekommt Datenbank, API, Auth, Editorial und Live-Ingestion
status: accepted
date: 2026-05-22
accepted_date: 2026-05-22
superseded_date:
wave: W0
deciders: Jean Schütz
relates_to: 026, 033
supersedes: —
superseded_by: —
---

# ADR-034 — Backend Pivot

## Kontext

WachSam läuft seit dem Rebuild als statische Single-Page-App unter `v01/` mit kontrolliertem Seed-Datensatz, ohne Backend, ohne Datenbank, ohne Auth, ohne Live-Ingestion. ADR-026 hatte diese Linie als bewussten Architekturschritt fixiert, ADR-033 hat die Grenzen einer späteren Live-Ingestion als Future-Work-Konzept dokumentiert.

Am 2026-05-22 ist im Live-Test-Verdikt der Wave 8.2 / UX-A klar geworden, dass die statische Linie das Produktversprechen nicht mehr trägt. Verdict-Kernsatz: *„Wissensbasis statt Produkt"* — die App vermittelt Methodik und Struktur, liefert aber keine aktuelle, personalisierte Haushaltswirkung. Methodik lebt in JSON-Dateien, nicht im Erlebnis.

### Bestandsaufnahme — Stand 2026-05-22

- Daten in `v01/data/*.json` sind redaktioneller Seed-Stand, ohne automatisches Refresh-Verfahren.
- Personalisierung ist nicht möglich — kein Haushaltsprofil, keine Region, keine Speicherung von Beobachtungs- oder Maßnahmen-Status.
- Inhalte können nur über Code-Edits gepflegt werden; jede Quelle, jeder Wert, jede Severity-Änderung erfordert einen Commit.
- Frühwarnindikatoren sind statisch (`warning-indicators.json`), ohne Vergleich zum aktuellen Wert.
- Live-Ingestion ist als Future-Work in ADR-033 abgegrenzt, aber ohne Implementierungspfad.

### Anforderungen

- Inhalte aktualisierbar ohne Code-Deploy (Editorial-Pflege).
- Persistente Haushaltsprofile (Region, Energieart, Heizung, Mobilität, Größe).
- Strukturierte API zwischen App-Frontend und Datenbestand.
- Auth-Layer für Editorial-Rolle und perspektivisch Endnutzer.
- Live-Ingestion-Pfad gemäß ADR-033 muss real andockbar sein.
- DSGVO-Konformität bleibt erhalten (deutscher Hoster, AVV, minimale PII).

## Entscheidung

WachSam bekommt ab Welle W1 ein vollständiges Backend: Datenbank, HTTP-API, Auth-Layer, Editorial-Oberfläche und ab Welle W2 eine isolierte Live-Ingestion-Schicht. Die statische Linie unter `v01/` wird nach Abschluss von W0 eingefroren und durch die neue App unter `v02/` ersetzt (siehe ADR-037). Detail-Entscheidungen zu Datenbank, Stack und Ingestion-Architektur stehen in ADR-035, ADR-036 und ADR-038.

## Begründung

- **Aktualität ist Produktversprechen.** Krisen- und Haushalts-Auswirkungsradar ohne aktuelle Quellenlage ist eine Wissensbasis, kein Radar. Ohne Live-Pfad bleibt der Anspruch unerfüllt.
- **Personalisierung braucht Persistenz.** Region, Heizart, Mobilitätsprofil und Haushaltsgröße entscheiden, welche Items relevant sind. Lokaler Browser-Storage skaliert nicht für Cross-Device-Nutzung und blockiert spätere Notifications.
- **Editorial ohne Code.** Quellen, Severity-Anpassungen, neue Items und Korrekturen müssen ohne Pull-Request möglich sein. Andernfalls bleibt die Datenpflege Entwickler-Engpass.
- **Ingestion braucht Senke.** ADR-033 verlangt Run-Log, Source-Fingerprint, Editorial-Review-Queue und Per-Source-Status. Ohne Datenbank existieren diese Strukturen nicht.
- **Trust-Layer bleibt operationalisierbar.** Provenance, redaktionelle Prüfung und Confidence sind im statischen Modell sichtbar, aber nicht auditierbar. Backend ermöglicht echte Audit-Spur.

## Konsequenzen

- `v01/` wird nach Abschluss von W0 eingefroren. README erhält Disclaimer „eingefroren als Static-Reference".
- `v02/` wird neben `v01/` im selben Repo angelegt (ADR-037). Hard-Cutover unter Hauptdomain sobald W1.7 deployt.
- Alle SoT-Docs (`docs/# WachSam.md`, `docs/# WachSam — Logik, Funktion & Metho.md`, `docs/product.md`, `docs/methodology.md`, `docs/brand.md`, `docs/ui-standard.md`) bekommen additiv eine v0.3-Sektion. Bestehende v0.1- und v0.2-Sektionen bleiben als historische Referenz.
- `docs/repo-structure.md` bekommt einen `v02/`-Block.
- IONOS-Deploy-Pipeline berücksichtigt sowohl statisches `v01/` (eingefroren) als auch dynamisches `v02/` (Next.js + Postgres in Docker).
- ADR-033 wird parallel von `draft` auf `accepted` gehoben — die Boundaries gelten ab jetzt operativ.
- Methodology-Gates aus ADR-028 bleiben bindend; sie werden im Editorial-Approval-Workflow durchgesetzt.

### Pfad-übergreifende Nicht-Konsequenzen

- Die Produkt-Direction (Deutschland-zentriert, Haushalts-Auswirkungsradar, kein Doomscrolling, kein Prepper-Forum) ändert sich nicht.
- Die zehn Systembereiche, die Severity- und Confidence-Skalen sowie die methodology_tag-Pflicht bleiben unverändert.
- Die Pflicht „keine erfundenen Quellen" bleibt — Editorial-Pflege ersetzt keine Quellen-Disziplin.

## Risiken

- **Risiko:** Bau-Zeit und Komplexitätszuwachs sprengen v0.x-Scope.
  - **Auswirkung:** Welle W1 zieht sich, v01/ veraltet währenddessen weiter.
  - **Gegensteuerung:** Schrittweise Wellen W1.1–W1.7 mit klar abgegrenztem Scope (Postgres-Setup, Schema, API, Auth, Profil, Editorial, Public-Cutover). Live-Ingestion und Notifications sind explizit Welle W2.
- **Risiko:** Ops-Last steigt erheblich (DB-Backups, Auth-Rotation, Editorial-User-Management).
  - **Auswirkung:** Single-Person-Operations wird zum Engpass.
  - **Gegensteuerung:** Self-Host auf bestehendem IONOS-VPS (siehe ADR-035), pg_dump-Backup-Cron, dokumentierte Runbooks unter `infra/ionos/`.
- **Risiko:** DSGVO-Footprint wächst durch persistente Profile.
  - **Auswirkung:** Datenschutzpflichten steigen, PII-Risiko entsteht.
  - **Gegensteuerung:** Minimal-Profile (Region, Energieart, Heizart, Mobilität, Größe), keine Klarnamen, keine Adressen, keine Mail außerhalb Auth. AVV mit IONOS bereits in Place. Datenschutzerklärung wird in W1 mit angelegt.
- **Risiko:** Hard-Cutover führt zu Regressions im öffentlichen Zustand.
  - **Auswirkung:** v02 geht mit Lücken live, v01 ist nicht mehr verfügbar.
  - **Gegensteuerung:** archive/dashboard-pre-rebuild-2026-05-22 bleibt Backup-Branch. v01/ bleibt im Repo lesbar. nginx-Switch erst nach W1.7-Verify.

## Open Decisions

- Auth-Provider-Detailauswahl (Auth.js v5 Adapter-Konfiguration) — wird in W1.4 entschieden.
- Editorial-Rollenmodell (nur Admin oder zusätzlich Reviewer-Rolle) — wird in W1.6 entschieden.
- Notifications-Kanal (E-Mail via Resend, optional Web-Push) — wird in Welle W2 entschieden.

## Status

`accepted` seit 2026-05-22. Welle W0 vollzieht die Annahme; Welle W1.x implementiert.

## Status-History

| Datum | Von | Nach | Auslöser |
|---|---|---|---|
| 2026-05-22 | — | accepted | User-Entscheidung Backend Pivot nach Live-Test-Verdikt Wave 8.2 / UX-A |
