# Spec: Digest-Versand und Frequenzwahl

## Ziel
Angemeldete Nutzer koennen aus ihrer Watchlist einen ruhigen Wochen-Digest konfigurieren, der per E-Mail versendet wird und dieselbe Quellen- und Stand-Transparenz wie die App zeigt.

## Clarifications
- F: Soll der vorhandene Digest sofort versendet werden? -> A: Nein, erst nach explizitem Opt-in und Frequenzwahl.
- F: Taeglich oder woechentlich? -> A: MVP ist woechentlich; taeglich ist spaeter optional.

## Bestand im Code
- Vorhanden: Auth per E-Mail, Resend-Abhaengigkeit, Watchlist, `buildWatchlistDigestPreview`, `/woche`.
- Fehlend: Digest-Einstellungen, Consent, Versand-Job, Mail-Template, Versand-Log, Unsubscribe/Pause.

## Umfang / Nicht-Umfang
- In Scope:
  - Profil-Einstellung fuer Wochen-Digest aktivieren/deaktivieren.
  - Frequenzfeld mit MVP-Wert `weekly`; Datenmodell zulaesst spaeter `daily`.
  - Digest-Inhalt aus Watchlist, Wochenbewegungen und vorhandenen Quellenstaenden.
  - E-Mail-Template als sachliche HTML/Text-Mail.
  - Versand-Log mit Status, Fehlerklasse und Zeit.
  - Unsubscribe-/Pause-Link, der ohne Login funktioniert und nur ein signiertes Token nutzt.
- Out of Scope:
  - Marketing-Newsletter.
  - Taeglicher Versand im MVP.
  - Personalisierte KI-Zusammenfassungen ohne Quellenanker.
  - Versand an nicht verifizierte E-Mail-Adressen.
  - Versand bei leerer Watchlist.

## Datenmodell / API
- Erwartete Migration:
  - `user_digest_settings`: `user_id`, `enabled`, `frequency`, `send_day`, `send_hour_utc`, `created_at`, `updated_at`.
  - `user_digest_deliveries`: `id`, `user_id`, `period_start`, `period_end`, `status`, `provider_message_id`, `error_code`, `sent_at`, `created_at`.
- Versand-Job:
  - CLI/Script oder Scheduler-kompatibler Server-Entry.
  - Dry-run Modus ist Pflicht.
  - Idempotenz ueber `(user_id, period_start, period_end, frequency)`.

## Definition of Done
- [ ] Nutzer kann im Profil den Wochen-Digest aktivieren und deaktivieren.
- [ ] Aktivierung ist ein klares Opt-in mit Hinweis auf E-Mail-Verarbeitung via Resend.
- [ ] Leere Watchlist verhindert Aktivierung oder zeigt einen ehrlichen Leerzustand.
- [ ] Dry-run erzeugt eine Vorschau ohne Versand.
- [ ] Produktiver Versand sendet hoechstens eine Mail pro Nutzer und Zeitraum.
- [ ] Unsubscribe/Pause funktioniert ohne Login und ohne PII im URL-Token.
- [ ] Tests gruen: `cd v02 && corepack pnpm run verify`.
- [ ] Versand-Smoke mit Resend-Testmodus oder eindeutigem Dry-run-Log dokumentiert.
- [ ] PASS durch zweiten DoD-Reviewer gegen diese Spec.

## Akzeptanzkriterien
- Wenn ein Nutzer Watchlist-Eintraege hat und den Wochen-Digest aktiviert, wird `enabled=true` gespeichert.
- Wenn der Versandjob zweimal fuer denselben Zeitraum laeuft, entsteht nur eine erfolgreiche Delivery.
- Wenn Resend fehlschlaegt, wird der Fehler als Klasse gespeichert, nicht als roher Secret-/Provider-Response.
- Wenn ein Nutzer pausiert, sendet der naechste Job keine Mail.
- Wenn eine Watchlist-Karte keinen aktuellen Stand hat, wird sie im Digest als "Stand offen" markiert oder weggelassen, aber nie als frisch dargestellt.

## Testplan
- Unit:
  - Digest-Content aus Watchlist + Wochenbewegungen.
  - Leere Watchlist -> kein versandfaehiger Digest.
  - Idempotenz-Key fuer Zeitraum/Frequenz.
  - Unsubscribe-Token validieren und abgelaufene Tokens ablehnen.
- Integration:
  - Settings create/update.
  - Dry-run ohne Provider-Call.
  - Delivery-Log bei Erfolg und Fehler.
- E2E:
  - `/profil`: Digest aktivieren, Status sichtbar, pausieren.
  - Mobile: Settings und Preview ohne Overflow.

## Qualitaetskriterien
- Mail-Betreff ruhig, z.B. "WachSam Wochenueberblick" statt Alarm-Sprache.
- Jede Mail enthaelt Quelle/Stand oder erklaert fehlenden Stand.
- Kein Tracking-Pixel, keine Link-Tracking-Parameter.
- Text- und HTML-Version sind inhaltlich deckungsgleich.
- Versand darf die App nicht blockieren; Fehler landen im Delivery-Log.

## Optimierung
- Digest-Builder bleibt providerfrei und testbar.
- Versand-Batch limitiert Empfaenger pro Lauf und kann fortgesetzt werden.
- Content wird pro Nutzer einmal erzeugt, nicht mehrfach fuer Text/HTML.
- Spaetere Erweiterung auf taeglich oder Kanalwahl nutzt dieselbe Settings-Tabelle.

## Security / DSGVO
- E-Mail-Versand nur nach Opt-in.
- Datenschutzseite muss Resend-Verarbeitung und Digest-Zweck nennen.
- Unsubscribe-Token ist signiert, kurz und enthaelt keine E-Mail im Klartext.
- Keine sensiblen Daten im Mail-Subject.
- Delivery-Logs speichern keine Mail-Inhalte.

## Rollback
- Digest-Settings UI ausblenden.
- Versandjob deaktivieren.
- Bestehende Settings bleiben erhalten, werden aber nicht verarbeitet.
