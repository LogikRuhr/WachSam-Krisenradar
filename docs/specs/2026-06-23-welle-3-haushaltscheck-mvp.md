# Spec: Welle 3 — Haushalts-Check-MVP

## Ziel (in einem Satz)
WachSam bekommt einen sichtbaren, anonym startbaren Haushalts-Check-Einstieg, der vorhandene Lage-, Kosten- und Maßnahmeninformationen nach wenigen Haushaltsangaben priorisiert, ohne neue Fakten oder Euro-Beträge zu erfinden.

## Clarifications (vom Agenten gestellte Rückfragen + meine Antworten)
- F: Sollen alle Wellen mit Spec und Plan starten? → A: Ja, alle Wellen implementieren immer mit Spec und Plan.
- F: Soll nach Welle 2 direkt die Haushalts-Check-MVP-Spec gestartet werden? → A: Ja, freigegeben.

## Ist-Zustand aus Repo-Prüfung
- Aktive Arbeitsbasis ist `v02/`.
- `v02/web/app/page.tsx` zeigt bereits öffentliche Lagekarten, `NutzenBoard`, `Verdict`, `SignalChain`, Quellen-/Datenstand und Links zu Maßnahmen.
- `v02/web/app/profil/page.tsx` hat einen eingeloggten persönlichen Bereich mit Profilstatus, priorisierten Signalen, Maßnahmen und Checkliste.
- `v02/web/app/profil/profile-form.tsx` speichert aktuell `modus`, `plz`, `heizart` nur für angemeldete Nutzer.
- `v02/web/lib/personalization.ts` enthält reine Sortier-/Erklärfunktionen für Modus, Heizart, Profilvollständigkeit, Signal-/Maßnahmenpriorisierung und Checkliste.
- Der öffentliche Einstieg ist noch kein klarer kurzer Haushalts-Check mit anonymen Eingaben und Ergebniszusammenfassung.

## Umfang / Nicht-Umfang
- In Scope: öffentlicher, anonymer Check-Einstieg auf `/` mit wenigen Feldern: Haushaltstyp/Modus, Heizart, optional PLZ als nicht gespeicherte Eingabe.
- In Scope: Ergebnisbereich, der vorhandene öffentliche Daten nach bestehender Personalisierungslogik priorisiert und erklärt: „betrifft dich wahrscheinlich“, „Kosten-/Versorgungsrichtung“, „nächster Prüfschritt“, „was eher nicht direkt betrifft“.
- In Scope: lokale UI-State-Lösung nur für diesen Check; keine Speicherung, kein Tracking, keine DB-Migration.
- In Scope: Wiederverwendung vorhandener Funktionen in `v02/web/lib/personalization.ts` und vorhandener Komponenten, wenn möglich.
- In Scope: Tests für neue reine Funktionen oder erweiterte Personalisierungslogik.
- Out of Scope: echte individuelle Euro-Berechnung, neue Datenquellen, neue Scores, neue Quellen-URLs, DB-Schemaänderungen, Auth-Zwang, Deploy.
- Out of Scope: medizinische, rechtliche oder finanzielle Beratung; Ergebnis bleibt Orientierung.

## Definition of Done
- [ ] Öffentliche Startseite enthält einen klaren Haushalts-Check-Einstieg oberhalb oder direkt nach dem Hero.
- [ ] Check kann ohne Login benutzt werden und speichert nichts serverseitig.
- [ ] Ergebnis nennt mindestens drei klare Gruppen, sofern Daten vorhanden sind:
  - `Für dich wahrscheinlich relevant`
  - `Kosten / Versorgung beobachten`
  - `Nächster ruhiger Prüfschritt`
- [ ] Ergebnis markiert mindestens eine Grenze: keine sichere Vorhersage, keine Beratung, keine individuellen Euro-Beträge.
- [ ] Wenn DB/public data nicht verbunden ist, bleibt der bestehende `DbNotice` sichtbar und der Check erfindet keine Ergebnisse.
- [ ] Mobile 390×844 hat keinen horizontalen Overflow (`scrollWidth <= clientWidth`).
- [ ] Keine neuen Daten, URLs, Quellenstände, Scores oder Live-/Realtime-Claims.
- [ ] Tests grün — `cd v02 && pnpm run verify` bzw. `bash scripts/verify.sh`.
- [ ] PASS durch DoD-Review gegen diese Spec.

## File-Liste für die Implementierungswelle

ADD:
- `v02/web/components/HouseholdCheck.tsx` — Client-Komponente für anonyme Eingaben und Ergebnisanzeige.
- Optional `v02/web/lib/household-check.ts` — reine Ableitungsfunktion, falls Logik sonst in der Komponente landen würde.
- Optional `v02/web/lib/household-check.test.ts` — Tests für Ergebnispriorisierung/Grenzen.

CHANGE:
- `v02/web/app/page.tsx` — `HouseholdCheck` in den öffentlichen Einstieg integrieren und mit vorhandenen `signals.rows`/`actions` bzw. geeigneten öffentlichen Daten versorgen.
- `v02/web/lib/personalization.ts` — nur falls vorhandene Funktionen für anonymen Check fehlen; keine Faktenlogik duplizieren.
- `v02/web/app/globals.css` — nur erforderliche responsive Klassen für den Check, mobile-first und ohne horizontales Overflow.
- Optional `docs/ui-standard.md` — nur wenn ein dauerhaftes neues Pattern dokumentiert werden muss.

DELETE:
- Keine Dateien.

## Plan
1. Vor Code erneut relevante Dateien lesen: `page.tsx`, `public-data.ts`, `personalization.ts`, vorhandene Tests und CSS-Patterns.
2. Reine Ergebnislogik definieren: Eingabeprofil → priorisierte Signale/Maßnahmen + Grenzhinweis; keine neuen Fakten, nur Sortierung und Erklärung.
3. Failing Tests für reine Logik schreiben, falls neue Helper entstehen.
4. `HouseholdCheck` als kleine Client-Komponente bauen:
   - Modus-Auswahl
   - Heizart-Auswahl
   - optionale PLZ-Eingabe mit Hinweis „wird nicht gespeichert“
   - Ergebnisblöcke aus vorhandenen Daten
5. Startseite integrieren:
   - Check früh sichtbar platzieren
   - bestehende Lage-/Trust-Blöcke behalten
   - DB-offline-Fall unverändert ehrlich zeigen
6. CSS mobile-first ergänzen, nur falls vorhandene Klassen nicht reichen.
7. Verify lokal ausführen:
   - gezielte Tests, falls neu
   - `cd v02 && pnpm run verify`
   - `bash scripts/verify.sh`
8. Browser-Smoke lokal oder gegen Preview:
   - Desktop sichtbar
   - Mobile 390×844 ohne horizontalen Overflow
   - kein JS-Console-Fehler
9. DoD-Review gegen diese Spec, dann explizite Commit-Freigabe einholen.

## Acceptance-Beispiele
- Nutzer wählt `Familie` + `Gas` und sieht Energie-/Lebensmittel-/Mobilitätsbezug zuerst, inklusive Quellen-/Unsicherheitsgrenze.
- Nutzer wählt `Rentner` + `Wärmepumpe` und sieht Strom-/Kostenbezug als ruhige Orientierung, nicht als sichere Kostenprognose.
- Ohne DB-Verbindung erscheint kein Fake-Ergebnis, sondern der bestehende Datenbankhinweis.
- PLZ-Eingabe bleibt optional und wird in Welle 3 nicht für konkrete regionale Fakten verwendet, solange keine belastbare regionale Datenlogik vorhanden ist.

## Rollback
- UI-Integration kann durch Entfernen von `HouseholdCheck` aus `v02/web/app/page.tsx` zurückgenommen werden.
- Neue Komponente/Helper/Tests können in einem Einzelcommit revertet werden.
- Keine DB-, Auth- oder Deploy-Seiteffekte.
