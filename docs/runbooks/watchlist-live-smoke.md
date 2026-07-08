# Watchlist Live-Smoke

## Zweck
Eingeloggten Watchlist-Pfad nach Deploy oder DB-Migration live pruefen, ohne Testdaten im Repo oder Secrets in Logs.

## Voraussetzungen
- Prod-Migration fuer `user_watchlist_items` ist angewendet.
- Operator kann sich mit einem eigenen WachSam-Konto anmelden.
- Kein `db:seed` auf Produktion fuer diesen Smoke.

## Ablauf
1. `https://wachsam.ruhrlogik.de/profil` oeffnen und anmelden.
2. Im Abschnitt `Watchlist` unter `Vorschlaege` eine Lagekarte mit `Beobachten` speichern.
3. Erwartung:
   - Die Karte erscheint unter `Beobachtet`.
   - Die `Digest-Vorschau` nennt die beobachtete Karte.
   - Keine Browser-Console-Errors, keine 5xx-Responses, kein horizontaler Overflow auf Mobile.
4. Dieselbe Karte mit `Entfernen` wieder loeschen.
5. Erwartung:
   - Die Karte verschwindet aus `Beobachtet`.
   - Die Karte ist wieder als Vorschlag sichtbar oder die Vorschlagsliste bleibt ehrlich leer.

## DB-Read-Check Optional
Nur read-only, keine Werte mit E-Mail ausgeben:

```bash
docker exec wachsam-postgres psql -U wachsam -d wachsam -c "select count(*) from user_watchlist_items;"
```

## Fail-Kriterien
- `/profil` zeigt 500/Fehlerseite.
- Add erzeugt mehrere gleiche Karten.
- Remove loescht nicht oder loescht fremde Nutzer-Daten.
- Digest verspricht Versand statt Vorschau.

## Cleanup
Den im Smoke gesetzten Watchlist-Eintrag im UI entfernen. Keine direkten Prod-DB-Writes fuer Cleanup.
