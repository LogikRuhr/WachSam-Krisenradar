# Spec: Audit-Resthaertung UI und Datenlogik

## Ziel
Kleine verbleibende Audit-Reste werden in einem engen Hardening-PR beseitigt: keine Infinity-Ausgabe, klarere Region-Labels, finaler Startseiten-Wording-Follow-up und belastbare DWD-Code-Verifikation.

## Clarifications
- F: Ist das eine neue Produktwelle? -> A: Nein, es ist Resthaertung nach den Audit-Wellen.
- F: Duerfen neue Datenquellen eingefuehrt werden? -> A: Nein, nur bestehende DWD-/UI-/Indikatorlogik haerten.

## Bestand im Code
- `computeInjectionPeriod` kann bei abgelaufener Frist und offener Luecke `Infinity` als `requiredDailyRate` liefern.
- `InjectionTracker` formatiert Raten, aber der Downstream-Guard ist nicht explizit getestet.
- `RegionSwitcher` labelt "Bundesland", obwohl nur die Warnlage-Karte regionalisiert wird.
- Startseite hat den frueheren Follow-up bereits teilweise verbessert, aber die Spec `2026-07-07-haushalt-first-einstieg.md` markiert den H-Text als Review-Rest.
- DWD `NRW`-Code ist in Tests synthetisch vorhanden, aber Live-Code-Kompatibilitaet fuer Nordrhein-Westfalen bleibt als Audit-Risiko dokumentiert.

## Umfang / Nicht-Umfang
- In Scope:
  - `computeInjectionPeriod` so haerten, dass keine nicht-endliche Rate in UI-Props gelangt.
  - Tests fuer abgelaufene Frist mit offener Luecke.
  - RegionSwitcher-Label und Hilfetext praezisieren.
  - Startseiten-Kontext final auf Haushalts-Krisencheck-Wording pruefen und ggf. kuerzen.
  - DWD-State-Code-Mapping pruefen und Test fuer `NW`/`NRW`-Normalisierung ergaenzen, falls DWD live `NW` nutzt.
- Out of Scope:
  - Neue DWD-Adapterarchitektur.
  - Neue regionale Datenquellen.
  - PLZ-Logik; diese gehoert zur PLZ-Spec.
  - Alerts, Digest oder Watchlist-Aenderungen.

## Definition of Done
- [ ] Kein Pfad kann `Infinity`, `NaN` oder nicht-endliche Werte in `InjectionTracker` anzeigen.
- [ ] Tests decken Frist abgelaufen + Ziel nicht erreicht ab.
- [ ] RegionSwitcher sagt sichtbar, dass nur die amtliche Warnlage regionalisiert wird.
- [ ] Startseiten-Kontext nutzt konsistent Haushalts-Krisencheck-Sprache.
- [ ] DWD-Code-Frage ist belegt: entweder live verifiziert oder per Normalisierung robust gegen `NW` und `NRW`.
- [ ] Tests gruen: `cd v02 && corepack pnpm run verify`.
- [ ] Python-Adaptertests gruen, falls DWD-Code geaendert wird: `cd v02/intelligence && python -m pytest tests/ -q`.
- [ ] Browser-Smoke `/`, `/radar`, `/indikatoren/[id]` Desktop/Mobile.
- [ ] PASS durch zweiten DoD-Reviewer gegen diese Spec.

## Akzeptanzkriterien
- Ein abgelaufener Zielindikator mit Restluecke zeigt "Frist abgelaufen" oder einen vergleichbaren Zustand, nicht `Infinity`.
- Ein aktiver Zielindikator mit Restzeit zeigt weiterhin eine taegliche Zielrate.
- `/radar` macht klar: Bundesland betrifft die amtliche Warnlage, nicht alle Themenkanaele.
- Die Startseite enthaelt kein altes "Krisenradar"- oder zu breites "Auswirkungenradar"-Framing im Hauptkontext.
- DWD-Warnungen fuer Nordrhein-Westfalen werden auch dann korrekt gemappt, wenn der Feed `NW` statt `NRW` liefert.

## Testplan
- Unit:
  - `computeInjectionPeriod` aktiv, Ziel offen, Resttage > 0.
  - `computeInjectionPeriod` Frist abgelaufen, Ziel erreicht.
  - `computeInjectionPeriod` Frist abgelaufen, Ziel offen.
  - DWD-State-Code-Normalisierung fuer `NW` und `NRW`, falls implementiert.
- Component/UI:
  - `InjectionTracker` zeigt keinen nicht-endlichen Wert.
  - RegionSwitcher Accessible Name enthaelt Warnlage-Kontext.
- E2E:
  - `/radar` Desktop/Mobile ohne Overflow und mit klarem Region-Hinweis.
  - `/` ohne alte Drift-Wording-Reste.

## Qualitaetskriterien
- Keine Panik-Sprache bei abgelaufenen Fristen.
- Mathematische Sonderwerte werden an der Domain-Grenze abgefangen, nicht erst im Textformat.
- Labels beschreiben exakt den Wirkbereich.
- DWD-Code-Loesung ist robust und testbar, nicht nur ein Kommentar.

## Optimierung
- Kleine reine Helper-Funktion fuer finite-rate Guard oder DWD-Code-Normalisierung.
- Keine App-weiten Refactors.
- Tests nah an bestehende Testdateien haengen.
- Live-DWD-Pruefung read-only und ohne persistente Datenbankwrites.

## Security / DSGVO
- Keine neuen Nutzerdaten.
- Keine Secrets.
- Live-DWD-Pruefung schreibt keine Payloads mit potenziell grossen Rohdaten in tracked Files.

## Rollback
- Einzelne UI-Wording-Aenderungen revertieren.
- DWD-Normalisierung kann isoliert zurueckgenommen werden.
- Injection-Guard revertierbar, solange Tests den alten Fehler wieder sichtbar machen.
