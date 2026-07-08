# Spec: Schwellen- und Preisalarm

## Ziel
Angemeldete Nutzer koennen fuer beobachtete WachSam-Werte ruhige, opt-in-basierte Schwellen- oder Preisalarme anlegen und im Profil nachvollziehen, warum ein Alarm ausgeloest wurde.

## Clarifications
- F: Soll der Alarm aktiv senden oder zuerst nur im Konto sichtbar sein? -> A: MVP ist In-App-Alarm im Profil; Versand wird in der Digest-Spec separat entschieden.
- F: Sind frei formulierte Alarmtexte erlaubt? -> A: Nein, Alarme werden aus vorhandenen Indikatorwerten, Schwellen und Quellenstand berechnet.

## Bestand im Code
- Vorhanden: `user_watchlist_items`, `WatchlistPanel`, `watchlist.ts`, `watchlist-digest.ts`, Indikator-Schwellen, `PriceRadar`, Auth.js/Resend.
- Fehlend: Alert-Regeln, Alert-Auswertung, Alert-UI, Tests fuer Ausloesung, Rate-Limit/Consent-Logik.

## Umfang / Nicht-Umfang
- In Scope:
  - Alert-Regeln fuer Watchlist-Eintraege und Preisindikatoren mit vorhandenen Messwerten.
  - Regeltypen: "Stufe erreicht", "Preis ueber Wert", "Preis unter Wert", "Aenderung seit letzter Messung".
  - Profil-UI zum Anlegen, Pausieren und Loeschen von Regeln.
  - In-App-Alert-Historie mit Quelle, Stand, Messwert, Schwelle und Ausloesezeit.
  - Keine Alerts fuer Indikatoren ohne aktuellen Wert oder ohne belastbare Quelle.
- Out of Scope:
  - Push Notifications.
  - SMS, WhatsApp, Slack oder externe Webhooks.
  - Frei erfundene Schwellenwerte ohne sichtbare Nutzerregel oder kanonische Daten-Schwelle.
  - Automatischer E-Mail-Versand; das gehoert zur Digest-Spec.

## Datenmodell / API
- Erwartete Migration:
  - `user_alert_rules`: `id`, `user_id`, `target_type`, `target_id`, `condition`, `threshold_value`, `enabled`, `created_at`, `updated_at`.
  - `user_alert_events`: `id`, `rule_id`, `triggered_at`, `observed_value`, `observed_at`, `source_stand`, `dedupe_key`.
- `dedupe_key` verhindert Mehrfachausloesung fuer denselben Wert/Stand.
- Server Actions validieren `target_id` gegen vorhandene oeffentliche Indikatoren oder Watchlist-Karten.
- Keine Speicherung von IP, Device, User Agent oder Standort.

## Definition of Done
- [ ] Nutzer kann auf `/profil` fuer einen Watchlist-/Preiswert eine Alert-Regel anlegen, pausieren und loeschen.
- [ ] Ein Alert wird nur ausgeloest, wenn aktueller Wert, Stand-Datum und Quelle vorhanden sind.
- [ ] Ein Alert zeigt nie "live", sondern Messwert, Stand und Quelle.
- [ ] Doppelte Ausloesungen fuer denselben Messwert werden verhindert.
- [ ] Nutzer sieht eindeutig, dass es Orientierung ist, keine Warn-App und keine Beratung.
- [ ] Tests gruen: `cd v02 && corepack pnpm run verify`.
- [ ] UI-Smoke gruen: Desktop und Mobile `/profil`, kein horizontaler Overflow, keine Console-Errors.
- [ ] PASS durch zweiten DoD-Reviewer gegen diese Spec.

## Akzeptanzkriterien
- Wenn ein Nutzer Diesel > 1.90 EUR/l als Regel setzt und der aktuelle Wert 1.91 ist, erscheint ein In-App-Alert mit Wert, Schwelle, Quelle und Stand.
- Wenn derselbe Wert beim naechsten Request unveraendert bleibt, wird kein zweites Event angelegt.
- Wenn ein Indikator keinen `currentValue` oder kein `currentValueDate` hat, ist die Alert-Anlage fuer diesen Wert deaktiviert und erklaert warum.
- Wenn ein Nutzer eine Regel pausiert, erzeugt sie keine neuen Events.
- Wenn ein Nutzer sein Konto loescht, werden Regeln und Events per FK/Cascade oder explizitem Cleanup entfernt.

## Testplan
- Unit:
  - Alert-Condition-Auswertung fuer alle Regeltypen.
  - Dedupe-Key stabil fuer `rule_id + observed_value + observed_at`.
  - Keine Ausloesung bei fehlendem Wert, fehlendem Stand oder deaktivierter Regel.
- Server Action:
  - Validierung ungueltiger `target_id`.
  - Create/Pause/Delete nur fuer den eingeloggten Nutzer.
  - Keine Cross-User-Manipulation.
- DB:
  - Unique-/Dedupe-Constraint greift.
  - Cascade bei Nutzerloeschung ist abgedeckt.
- E2E:
  - `/profil`: Regel anlegen, Alert sichtbar, Regel pausieren, Regel loeschen.
  - Mobile 393px: Formular und Alert-Historie ohne Overflow.

## Qualitaetskriterien
- Sprache ruhig: "Hinweis" statt "Alarm", keine roten Dauerbanner, keine Dramatik.
- Jede Ausloesung ist auditierbar: Wert, Schwelle, Stand, Quelle.
- Keine Alerts fuer stale/source-error Werte ohne ausdruecklichen "Datenstand veraltet"-Hinweis.
- Regel-UI ist kompakt und nicht prominenter als Haushaltscheck/Watchlist.
- Fehlerfaelle sind nutzerverstaendlich und loggen keine PII.

## Optimierung
- Regel-Auswertung als reine Funktion bauen, damit sie spaeter in Scheduler, Digest und UI wiederverwendet werden kann.
- Alert-Liste serverseitig auf die letzten 10 Events begrenzen.
- Indizes auf `(user_id, enabled)` und `dedupe_key`.
- Keine N+1-Queries bei mehreren Watchlist-Regeln; Zielwerte gebuendelt laden.

## Security / DSGVO
- Opt-in pro Regel; keine Default-Regeln.
- Keine Standortdaten ausser freiwillig bereits gespeicherter Profil-/Region-Entscheidung aus der PLZ-Spec.
- Keine sensiblen Kategorien, keine Gesundheitsdaten.
- Nutzer kann Regeln loeschen; Loeschung entfernt Events.
- Resend/API-Secrets bleiben ausserhalb tracked Files.

## Rollback
- UI-Schalter verstecken, Server Actions deaktivieren.
- Bei Datenproblem neue Tabellen nicht weiter beschreiben; technische Ruecknahme nur nach Backup und separater Freigabe.
