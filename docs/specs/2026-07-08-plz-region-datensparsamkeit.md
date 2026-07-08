# Spec: PLZ, Region und Datensparsamkeit

## Ziel
WachSam entscheidet und implementiert eindeutig, ob die Profil-PLZ genutzt oder gestrichen wird, damit Region, Datenschutz und Haushaltsnutzen nicht widerspruechlich bleiben.

## Clarifications
- F: Soll die PLZ fuer Praezision genutzt werden? -> A: Empfehlung ist Datensparsamkeit: PLZ nicht serverseitig speichern; Bundesland-Region bleibt als funktionaler Cookie.
- F: Was passiert mit bestehender Profil-PLZ? -> A: Bestehende Werte werden nach Migration/Cleanup geloescht oder ignoriert, je nach Implementierungsplan.

## Bestand im Code
- Vorhanden:
  - Profil speichert `plz`.
  - Anonymer Haushaltscheck fragt optional PLZ ab, nutzt sie aber nicht fuer regionale Fakten.
  - `RegionSwitcher` nutzt `ws-region` Cookie fuer DWD-Warnlage auf `/radar`.
  - Datenschutz nennt Profil-PLZ.
- Problem:
  - PLZ ist personenbezogener als Bundesland, liefert aber aktuell keinen klaren Produktnutzen.
  - RegionSwitcher-Label "Bundesland" suggeriert Filterung aller Kanaele, filtert aber nur Warnlage.

## Umfang / Nicht-Umfang
- In Scope:
  - Produktentscheidung dokumentieren: PLZ streichen oder aktiv nutzen.
  - Empfehlung umsetzen: serverseitige PLZ aus Profil entfernen oder nicht mehr neu erheben.
  - Region explizit als Bundesland-Warnlage ausweisen.
  - Texte in Profil, Haushaltscheck, Datenschutz und Onboarding angleichen.
  - Optional: vorhandene PLZ-Werte per Migration nullen, wenn Spalte bleibt.
- Out of Scope:
  - PLZ-genaue DWD-/NINA-Auswertung.
  - Geocoding, Karten, Adressdaten.
  - Mehrfach-Orte wie Wohnort/Arbeitsort/Elternhaus.
  - Regionale Preisberechnung aus individueller PLZ.

## Datenmodell / API
- Bevorzugter MVP:
  - Profil-PLZ wird nicht mehr erhoben.
  - Bestehende `plz`-Spalte bleibt technisch zunaechst optional, wird aber nicht beschrieben.
  - Optionaler Cleanup setzt vorhandene `plz` auf `NULL`.
- Alternative, nur mit separater Freigabe:
  - PLZ wird in Bundesland abgeleitet und danach verworfen.
  - Gespeichert wird nur `region_code`, nicht die PLZ.

## Definition of Done
- [ ] Es gibt keine neue serverseitige PLZ-Erhebung im Profil.
- [ ] Anonymer Haushaltscheck fragt keine PLZ mehr ab oder erklaert rein lokale Nicht-Speicherung.
- [ ] Datenschutz, Profil-Transparenz und Onboarding widersprechen sich nicht.
- [ ] RegionSwitcher labelt klar "Bundesland fuer amtliche Warnlage".
- [ ] `/radar` erklaert, dass der Filter nur die Warnlage-Karte regionalisiert.
- [ ] Existing DB cleanup ist geplant und nur nach Backup/Freigabe ausgefuehrt.
- [ ] Tests gruen: `cd v02 && corepack pnpm run verify`.
- [ ] Browser-Smoke Desktop/Mobile fuer `/`, `/profil`, `/radar`, `/datenschutz`.
- [ ] PASS durch zweiten DoD-Reviewer gegen diese Spec.

## Akzeptanzkriterien
- Ein neuer Nutzer kann sein Profil ohne PLZ speichern.
- In `/profil` steht nicht mehr, dass PLZ gespeichert wird, wenn sie nicht genutzt wird.
- In `/radar` ist klar, dass Bundesland nur die amtliche Warnlage betrifft.
- Datenschutz nennt keine Profil-PLZ mehr, falls sie nicht mehr erhoben wird.
- Wenn bestehende PLZ-Werte geloescht werden, bleiben Modus, Heizart, Watchlist und Auth unberuehrt.

## Testplan
- Unit:
  - Profil-Parser akzeptiert fehlende PLZ.
  - Personalization-Completeness zaehlt PLZ nicht mehr als Vollstaendigkeitspunkt.
  - Region-Cookie bleibt unabhaengig vom Profil.
- E2E:
  - Profil speichern ohne PLZ.
  - RegionSwitcher setzt Cookie und aktualisiert `/radar`.
  - Datenschutzseite enthaelt neue Zweckbeschreibung.
- DB:
  - Optionaler Cleanup-Dry-run zeigt Anzahl vorhandener PLZ-Werte ohne Ausgabe der Werte.

## Qualitaetskriterien
- Datensparsamkeit ist sichtbar: weniger Felder, weniger Erklaerlast.
- Keine halbgenutzte PII.
- Labels beschreiben den tatsaechlichen Effekt, nicht einen groesseren Filterumfang.
- Keine Regression beim Haushaltscheck oder Watchlist-Profil.

## Optimierung
- Region-Cookie bleibt klein, anonym und clientseitig.
- Wenn spaeter regionale Features kommen, zuerst Bundesland, nicht PLZ.
- PLZ-zu-Bundesland-Ableitung nur on-device oder als einmalige Umwandlung ohne Speicherung der PLZ.

## Security / DSGVO
- PLZ gilt als personenbezogenes Datum, wenn sie mit Konto gespeichert wird.
- Minimierungsprinzip: Nicht speichern, solange kein klarer Nutzen existiert.
- Cleanup-Logs duerfen nur Counts enthalten, keine PLZ-Werte.
- Datenschutztext muss Zweck, Speicherfrist und Loeschung konsistent nennen.

## Rollback
- Falls PLZ doch gebraucht wird, Feld hinter neuer Spec und neuer Freigabe wieder einfuehren.
- Vor Cleanup Backup erstellen; Rueckspiel nur bei technischem Fehler und nach Freigabe.
