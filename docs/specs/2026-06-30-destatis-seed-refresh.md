# Spec: Destatis VPI Seed Refresh

## Ziel
Destatis VPI wieder als echten Live-Indikator liefern und danach Produktion kontrolliert seeden und aktualisieren.

## Umfang / Nicht-Umfang
- In Scope: Destatis VPI Adapter, Tests, Source Registry, kontrollierter Seed/Refresh, Live-Smoke.
- Out of Scope: neue Quellen, Schema-Migration, Auto-Publish von RSS/LLM-Meldungen.

## Definition of Done
- [ ] Destatis liefert `wi-inflation-vpi-de` mit Wert, Datum und Vorwert.
- [ ] Live-Dry-Run zeigt Destatis ohne Source-Error.
- [ ] Produktion ist mit `pnpm db:seed` idempotent geseedet.
- [ ] Produktion hat einen One-off Intelligence-Refresh ausgefuehrt.
- [ ] Startseite und `/status` zeigen aktualisierte Preis-/Adapterdaten.
- [ ] Verify: `bash scripts/verify.sh`, `cd v02 && corepack pnpm run verify`, `cd v02/intelligence && python -m pytest tests/ -q`.

## Vorgehen
1. GENESIS-JSON-Fehler erkennen, statt sie als CSV zu parsen.
2. Offizielle Destatis-HTML-Tabelle als robusten Fallback parsen.
3. YoY aus aktuellem VPI-Index und Vorjahresmonat berechnen.
4. Tests und Source Registry aktualisieren.
5. Nach Deploy Seed und One-off Refresh per SSH ausfuehren.

## Rollback
- Code-Rollback auf vorherigen Commit und Deploy.
- Runtime-Restore aus `/opt/wachsam/backups/v02-pre-promote-*`.
- DB-Seed ist idempotent; falsche Livewerte per letztem DB-Backup oder vorherigem Indikatorwert wiederherstellen.
