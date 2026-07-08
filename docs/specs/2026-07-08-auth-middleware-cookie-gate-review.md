# Spec: Auth Middleware Cookie Gate Review

## Ziel
Das geschuetzte Routing nutzt keine unklare Cookie-Praesenz als Sicherheitsentscheidung, ohne DB-Session-Cookies im Edge-Pfad als JWT zu rotieren.

## Clarifications
- F: Ist der Low-Fund bereits teilweise behoben? -> A: Ja, der Branch `test/watchlist-e2e-hardening` ersetzt die Auth.js-Edge-Middleware durch ein schmales Cookie-Gate, damit DB-Sessions nicht als JWT rotiert werden.

## Umfang / Nicht-Umfang
- In Scope: `v02/web/middleware.ts`, `v02/web/auth.config.ts`, serverseitige `auth()`-/Rollenpruefungen, Invariant-Tests.
- In Scope: Bewertung, ob `authorized()` in `auth.config.ts` nach Middleware-Umstellung noch gebraucht wird oder stale ist.
- Out of Scope: neues Auth-System, neue Rollen, Session-Strategie-Wechsel ohne eigene Spec.

## Kriterien
- Ungueltige oder abgelaufene Cookies fuehren nicht zu privilegierten Daten oder Aktionen.
- `/profil` bleibt fuer nicht eingeloggte Nutzer auf `/login` umgeleitet.
- `/admin` und `/review` bleiben serverseitig durch `requireEditorRole()` abgesichert.
- Middleware rotiert DB-Session-Cookies nicht als JWT.
- Invariants beschreiben die tatsaechliche Sicherheitsgrenze korrekt.

## Tests
- `cd v02 && pnpm run verify`
- `cd v02 && pnpm exec playwright test tests/e2e/review-auth.spec.ts`
- `cd v02 && pnpm run smoke:watchlist` mit lokaler DB.
- Negativtest: gefaelschter Session-Cookie sieht keine Admin-/Review-Daten.

## Qualitaet
- Edge-Middleware bleibt DB-frei.
- Server-Komponenten und Actions bleiben die verbindliche Authz-Grenze.
- Keine stillen 500er bei kaputten Cookies.

## Optimierung
- Stale `authorized()`-Logik entfernen oder kommentarlos vereinfachen, wenn sie nicht mehr genutzt wird.
- Security-Invariant auf konkrete Route- und Server-Checks statt auf Implementierungsdetails ausrichten.

## Schritte
1. Aktuelle Middleware/AuthConfig-Aufrufe inventarisieren.
2. Cookie-Gate gegen gefaelschte/abgelaufene Cookies testen.
3. `auth.config.ts` vereinfachen oder bewusst belassen.
4. E2E- und Verify-Gates ausfuehren.
