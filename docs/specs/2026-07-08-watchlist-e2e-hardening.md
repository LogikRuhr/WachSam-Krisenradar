# Spec: Watchlist E2E-Haertung

## Ziel
Die bereits gebaute Watchlist wird mit echter Login-Session, Produktionsmigration und Browser-Smoke end-to-end verifiziert und gegen die wichtigsten Fehlerfaelle gehaertet.

## Clarifications
- F: Ist die Watchlist schon implementiert? -> A: Ja, UI, Server Actions, DB-Migration und Prod-Migration sind vorhanden.
- F: Was fehlt? -> A: Eingeloggter Add/Remove-Smoke, Fehlerfaelle, Cross-User-Schutz und klare Betriebschecks.

## Bestand im Code
- Vorhanden:
  - `user_watchlist_items` in Produktion.
  - `WatchlistPanel`.
  - `toggleWatchlistItemAction`.
  - `getUserWatchlistState`.
  - Digest-Preview.
- Fehlend:
  - Automatisierter E2E mit Auth-Session.
  - Prod-Smoke mit echtem Login.
  - Tests fuer doppelte Add-Vorgaenge und Cross-User-Isolation.

## Umfang / Nicht-Umfang
- In Scope:
  - Test- oder Operator-Login-Flow fuer E2E definieren.
  - Add/Remove einer Lagekarte im Profil verifizieren.
  - Duplicate Add verhindert doppelte Zeilen.
  - Delete betrifft nur den eingeloggten Nutzer.
  - Schema-pending-Fallback bleibt getestet.
  - Live-Smoke-Runbook fuer eingeloggte Watchlist.
- Out of Scope:
  - Neue Watchlist-Zieltypen ausser Lagekarten.
  - Alerts oder Mail-Versand.
  - Neues Design fuer das Profil.

## Definition of Done
- [ ] E2E-Test kann mit kontrollierter Auth-Session `/profil` oeffnen.
- [ ] Test fuegt eine Watchlist-Karte hinzu und entfernt sie wieder.
- [ ] Doppelklick/zweiter Add erzeugt keinen Duplicate.
- [ ] Cross-User-Zugriff ist nicht moeglich.
- [ ] Schema-pending-Fallback ist als Unit- oder Integration-Test abgedeckt.
- [ ] Live-Smoke mit echtem Login wurde dokumentiert: Add, Digest-Preview, Remove.
- [ ] Tests gruen: `cd v02 && corepack pnpm run verify`.
- [ ] Playwright-Smoke fuer Profil Desktop/Mobile gruen.
- [ ] PASS durch zweiten DoD-Reviewer gegen diese Spec.

## Akzeptanzkriterien
- Nach Klick auf "Beobachten" erscheint die Karte in "Meine beobachteten Karten".
- Nach Klick auf "Entfernen" verschwindet sie aus der Liste und wird wieder als Vorschlag angeboten.
- Bei wiederholtem Add existiert in der DB maximal eine Zeile fuer `(user_id, item_type, item_id)`.
- Ein Nutzer kann kein `itemId` loeschen, das nur einem anderen Nutzer gehoert.
- Wenn keine Signalketten geladen werden koennen, zeigt die Watchlist einen ehrlichen Leer- oder Fehlerzustand.

## Testplan
- Unit:
  - `buildWatchlistDigestPreview` fuer 0, 1 und mehr als 3 Items.
  - Missing-table-Erkennung fuer typische Postgres-Fehler.
- Server Action:
  - Create nur mit gueltiger `itemId`.
  - Delete scoped auf `user_id`.
  - Duplicate Add bleibt idempotent.
- E2E:
  - Auth-Session vorbereiten.
  - `/profil`: Add -> sichtbar -> Digest aktualisiert -> Remove -> nicht sichtbar.
  - Mobile 393px ohne Overflow.
- Prod-Smoke:
  - Ein Operator-Konto nutzt denselben Ablauf live.
  - Danach Testeintrag entfernen.

## Qualitaetskriterien
- Testdaten werden nach dem Test entfernt.
- Kein Test schreibt echte personenbezogene Daten ausser kontrollierter Test-E-Mail.
- UI bleibt bei DB-Fehlern nutzbar.
- Digest-Preview bleibt Vorschau und verspricht keinen Versand.

## Optimierung
- Auth-Testhelper zentralisieren, damit spaetere Profil-/Digest-/Alert-E2Es ihn wiederverwenden.
- Watchlist-Queries mit vorhandenen Signalketten mappen, statt pro Item nachzuladen.
- Buttons mit stabilen Accessible Names fuer E2E.

## Security / DSGVO
- Watchlist speichert nur User-ID und IDs oeffentlicher Lagekarten.
- Keine Quelleninhalte oder privaten Notizen speichern.
- Cross-User-Isolation ist Pflicht-Test.
- Test-Accounts duerfen nicht in tracked Files stehen.

## Rollback
- Bei Live-Problem WatchlistPanel im Profil ausblenden; Daten bleiben erhalten.
- Server Actions koennen deaktiviert werden, ohne bestehende Public-Routen zu beeintraechtigen.
