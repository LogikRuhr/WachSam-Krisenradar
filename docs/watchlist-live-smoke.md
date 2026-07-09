# Watchlist Live-Smoke

Zweck: Nach Deploy verifizieren, dass die eingeloggte Watchlist end-to-end funktioniert, ohne Testdaten oder Credentials zu tracken.

## Voraussetzungen

- Operator-Konto mit gültigem Login.
- Keine echten privaten Notizen oder personenbezogenen Testdaten erfassen.
- Vorher sicherstellen, dass die Watchlist-Migration in der Zielumgebung angewendet ist.

## Ablauf

1. `https://wachsam.ruhrlogik.de/profil` öffnen und einloggen.
2. Im Bereich `Für dich relevante Lagekarten` eine Karte mit `Beobachten` hinzufügen.
3. Prüfen, dass dieselbe Karte unter `Meine beobachteten Karten` erscheint.
4. Prüfen, dass die Digest-Vorschau die beobachtete Karte enthält.
5. Dieselbe Karte erneut hinzufügen, falls der Button noch sichtbar ist; es darf kein Duplicate entstehen.
6. Karte mit `Entfernen` löschen.
7. Prüfen, dass sie aus der Watchlist verschwindet und wieder als Vorschlag angeboten wird.
8. Im mobilen Viewport ca. `393px` `/profil` prüfen: kein horizontaler Overflow, keine Browser-Console-Errors.

## PASS-Kriterien

- Add, Digest-Vorschau und Remove funktionieren im selben Login.
- Keine doppelten Watchlist-Zeilen für dieselbe Lagekarte sichtbar.
- Entfernen betrifft nur das eingeloggte Konto.
- Nach dem Smoke bleibt kein künstlicher Testeintrag zurück.

## FAIL-Kriterien

- Watchlist zeigt Schema-Fehler statt nutzbaren Leerzustand.
- Duplicate ist sichtbar.
- Digest-Vorschau verspricht Versand statt Vorschau.
- Browser meldet sichtbare Runtime-Errors.
