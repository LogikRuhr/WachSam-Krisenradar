# Spec: Android-Passkey-Zugang fuer Editorial

## Ziel (in einem Satz)

Ein Betreiber kann sich auf dem Samsung Galaxy S25 Ultra nach einmaliger Einrichtung per Passkey mit Geraetebestaetigung bei WachSam anmelden, ohne bei jedem Zugriff einen Magic Link abzurufen.

## Clarifications (vom Agenten gestellte Rueckfragen + meine Antworten)

- F: Welches Zielgeraet soll der optimierte Zugang bedienen? → A: Samsung Galaxy S25 Ultra (Android).

## Relevante Lessons (Pflicht: LESSONS.md konsultieren)

- 2026-07-17 · Auth-Cookies aus Callbacks brauchen echte Dokument-Navigation. Die Passkey-Antwort wird deshalb per nativer Form an den Auth.js-Callback gesendet.
- 2026-06-18 · Neue plain-`tsx`-Tests muessen in `test:unit` und `verify` registriert werden.

## Umfang / Nicht-Umfang

- In Scope: Auth.js Passkey/WebAuthn mit vorhandener `authenticators`-Tabelle, Android-geeignete Passkey-Anmeldung, einmalige Registrierung im geschuetzten Profil, Entfernen eigener Passkeys, Magic-Link-Recovery und Tests.
- Out of Scope: Passwort-Login, externe Identitaetsanbieter, Auto-Publish, Rollenaufweitung oder neue personenbezogene Daten.

## Definition of Done

- [ ] Login zeigt Passkey als ersten Weg und Magic Link als Recovery.
- [ ] Passkey-Registrierung ist nur mit bestehender Session moeglich; Auth.js verlangt User Verification.
- [ ] Passkey-Anmeldung nutzt den festen produktiven RP-Origin und setzt die Session per echter Dokument-Navigation.
- [ ] Eigene Passkeys lassen sich im Profil entfernen; die Aktion ist auf den aktuellen User begrenzt.
- [ ] Tests gruen — TS: `cd v02 && pnpm run verify` · Python: `cd v02/intelligence && python -m pytest tests/ -q`
- [ ] Mobile Browser-Smoke gruen; produktiv eine Passkey-Registrierung und ein Folgelogin auf Android pruefen.
- [ ] PASS durch zweiten DoD-Reviewer — lokal `.claude/agents/reviewer.md`.

## Schritte

1. Auth.js-Provider, Adapter und RP-Origin sicher konfigurieren.
2. Passkey-Login und -Registrierung als mobile Formulare implementieren; Magic Link als Recovery erhalten.
3. Tests, Build, DoD-Review, Release und Produktionstest ausfuehren.

## Rollback

Den Passkey-Provider und die UI entfernen; die bestehende Magic-Link-Anmeldung bleibt ohne Datenmigration funktionsfaehig.
