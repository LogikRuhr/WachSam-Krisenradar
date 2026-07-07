# Spec: Haushalt-first-Einstieg (Drift-Korrektur nach PR #28)

Quelle: Produkt-Audit `outputs/product-drift-2026-07-06.md` (untracked, bewusst nicht committet), von Jean validiert am 2026-07-07.

## Befund

PR #28 (Radar-Produktschicht) hat WachSam in Navigation, Metadaten und PWA-Einstieg wieder Richtung „Radar-first" geschoben. Produktkern laut `docs/product-current.md:18-22` ist aber der **persönliche Haushalts-Krisencheck**: *„Was betrifft meinen Haushalt, was kostet es ungefähr pro Monat, und was kann ich konkret tun?"* Kein Bruch des Kernflusses (HouseholdCheck steht weiter vorn auf der Startseite), aber sekundärer Drift.

## Entscheidung

Radar und Woche bleiben als **Werkzeug/Vertiefung** erhalten, werden aber nicht mehr als Einstieg positioniert.

## Umsetzung (Niedrigrisiko)

1. **PWA-Einstieg:** `web/app/manifest.ts` — `start_url: "/"` statt `/radar`; `name` auf Haushalts-Check-Sprache.
2. **Navigation:** `web/components/TopNav.tsx` — Reihenfolge: Haushalt, Lage vor Radar, Woche (Rest unverändert).
3. **Metadaten:** `web/app/layout.tsx` — Titel/Beschreibung von „Krisenradar" auf Haushalts-Krisencheck-Sprache.
4. **Startseiten-Teaser:** `web/app/page.tsx` — Radar-Teaser bleibt (nach HouseholdCheck/Verdict), Wording von „Neu" auf „Werkzeug/Vertiefung" abgesenkt.

## Nicht in diesem Fix (Follow-ups)

- `page.tsx:107` H-Text „Lage- und Auswirkungenradar" → haushaltszentrierte Formulierung (Wording-Review nötig).
- Abgleich Navigation ↔ `docs/ui-standard.md:373-411` (vier Primärpfade + Werkzeuge-Menü + globaler Modus-Switcher) — größerer IA-Umbau, eigener Plan.
