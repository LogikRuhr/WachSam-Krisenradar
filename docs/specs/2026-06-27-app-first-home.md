# Spec: App-First Home

## Ziel (in einem Satz)
Die Startseite beantwortet im ersten Viewport, was den eigenen Haushalt betrifft, welche Kosten-/Versorgungsrichtung relevant sein kann und welcher naechste Pruefschritt sinnvoll ist.

## Clarifications (vom Agenten gestellte Rueckfragen + meine Antworten)
- F: Soll die Startseite weiter als Text-Landingpage starten? -> A: Nein, der Audit bestaetigt: WachSam muss app-first wirken.
- F: Duerfen neue Quellen, Live-Daten oder Euro-Werte erfunden werden? -> A: Nein, nur vorhandene Daten und ehrliche Leer-/Fehlerzustaende.

## Umfang / Nicht-Umfang
- In Scope: `/` priorisiert anonymen Haushalts-Check, Datenstand, Quellenstatus, erste Haushaltswirkung und naechsten Schritt.
- In Scope: Mobile und Desktop zeigen Check-Eingaben ohne Scroll als primaeren Einstieg.
- In Scope: Tests fuer Priorisierung und Public-Smoke werden aktualisiert.
- Out of Scope: neue Datenquellen, neue DB-Felder, Production-Deploy, echte Euro-Spannen ohne Datenbasis.

## Definition of Done
- [ ] Startseite hat ein app-first Haushalts-Cockpit statt grossem Text-Hero.
- [ ] Kein Fake-Live-State: fehlende DB/Daten zeigen ehrlichen Blocker ohne erfundene Ergebnisse.
- [ ] Keine horizontalen Overflows auf Desktop/Mobile.
- [ ] Tests gruen: `bash scripts/verify.sh`, `cd v02 && pnpm run verify`, `cd v02/intelligence && python -m pytest tests/ -q`.
- [ ] Browser-Smoke mit Desktop/Mobile-Screenshot zeigt Check im ersten Viewport.

## Schritte
1. Haushalts-Check als erster Startseiten-Screen.
2. Resultatflaeche auf Status, Top-Relevanz, Kosten-/Versorgungsrichtung und naechsten Schritt verdichten.
3. Erklaerende Story-/Nutzen-Bloecke unter die app-first Flaeche verschieben.
4. Unit- und E2E-Assertions anpassen.
5. Verify und Browser-Smoke ausfuehren.
