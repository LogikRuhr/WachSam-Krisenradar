# Spec: Source Health Findings Triage

## Ziel
Die Source-Health-Befunde vom 2026-07-08 werden reproduzierbar triagiert und in konkrete Adapter-/Config-Fixes oder bewusste Degradationsregeln ueberfuehrt.

## Clarifications
- F: Duerfen Prod-DB oder Prod-Secrets genutzt werden? -> A: Nein, nur read-only Dry-Run; echte Secrets bleiben lokal untracked oder werden vom User bereitgestellt.

## Umfang / Nicht-Umfang
- In Scope: Destatis VPI HTTP 401, Arbeitslosigkeit HTTP 401, GIE/AGSI HTTP-200-mit-C4, Handelsblatt RSS 0 Items, lokale API-Key-Degradation, fehlende Schwellen/C3-Advisory.
- In Scope: Adapter-Fehlerklassen, Source-Health-Report, Tests fuer degraded/stale/source-error.
- Out of Scope: Prod-DB-Writes, neue Datenquellen, automatisches Publishen, Secret-Rotation.

## Kriterien
- Jeder Befund hat Status `fixed`, `needs credential`, `source changed`, `expected degraded` oder `blocked by operator`.
- 401-Faelle unterscheiden fehlende Credentials von geaenderten Endpoints.
- GIE/AGSI prueft Response-Body und klassifiziert Auth-/Payload-Fehler trotz HTTP 200 sauber.
- RSS-0-Items wird als Quelle-leer vs. Fetch-/Parserfehler getrennt.
- API-Key-gebundene Adapter degradieren explizit und ohne falsche Draft-Behauptung.
- Indikatoren ohne DB-Schwellen sind inventarisiert und priorisiert.

## Tests
- `cd v02/intelligence && python -m pytest tests/ -q`
- `cd v02/intelligence && python -m pytest tests/ -m live -q` nur wenn Netz/Keys bewusst verfuegbar sind.
- `cd v02/intelligence && python -m src.main --dry-run --allow-fetch`
- Report-Check: kein Secret, keine PII, klare Source-Health-Klassen.

## Qualitaet
- Keine erfundenen Werte, keine Mock-Live-Daten.
- Alle Adapter-Logs nennen Quelle, Statusklasse und naechste sinnvolle Aktion.
- Dry-Run bleibt read-only.

## Optimierung
- Source-Health-Ausgabe so strukturieren, dass Daily-Monitor nur Findings trackt.
- Schwellen-Inventar in eine priorisierte Follow-up-Spec auslagern, wenn Umfang gross wird.

## Schritte
1. Dry-Run-Logs mit Report abgleichen.
2. Pro Adapter Befund klassifizieren.
3. Kleine Fixes oder Blocker dokumentieren.
4. Tests und neuen read-only Dry-Run ausfuehren.
