# Auth Onboarding Flow — 2026-07-09

## Ziel

WachSam bekommt einen vollständigen, datensparsamen Auth-Onboarding-Flow für Nutzer ohne vorhandenes Konto. Registrierung und Login bleiben UX-seitig getrennt, nutzen technisch aber denselben passwortlosen Auth.js/Resend-Magic-Link-Pfad.

## Standards 2026

- OWASP ASVS 5.0.0: Authentication, Session Management, Input Validation.
- NIST SP 800-63-4: Digital Identity, email-based authentication risk boundaries.
- OWASP Authentication Cheat Sheet und Session Management Cheat Sheet.
- WCAG 2.2 AA plus BFSG/EAA-relevante Bedienbarkeit.
- Auth.js v5 und Next.js App Router nach offizieller Dokumentation.

## In Scope

- Login-, Register-, Verify- und Error-Seiten klarer formulieren.
- Registration sendet einen Magic-Link und fuehrt nach erfolgreichem Login zum Profil-Onboarding.
- Login sendet einen Magic-Link und fuehrt nach erfolgreichem Login zum persoenlichen Bereich.
- Nutzer sehen keine Account-Enumeration: gleicher Erfolgshinweis fuer bekannte und neue E-Mail-Adressen.
- E-Mail wird ausschliesslich als Auth-Adresse erklaert.
- Profilseite zeigt Erstnutzer-orientierte Orientierung, sobald eine Session besteht.
- Tests fuer Auth-Onboarding-Texte, Redirect-Ziele und Sicherheitsinvarianten.

## Out of Scope

- Passwortlogin, Social Login, Passkeys.
- Neue Benachrichtigungen oder Digest-Versand.
- Prod-DB-Migration, Prod-Seed oder Operator-Rollenanlage.
- Speicherung weiterer Account-Metadaten.

## Datei-Scope

ADD:

- `docs/specs/2026-07-09-auth-onboarding-flow.md`
- `v02/web/lib/auth-onboarding.ts`
- `v02/web/lib/auth-onboarding.test.ts`

CHANGE:

- `v02/package.json`
- `v02/web/app/login/page.tsx`
- `v02/web/app/register/page.tsx`
- `v02/web/app/login/verify/page.tsx`
- `v02/web/app/login/error/page.tsx`
- `v02/web/app/profil/page.tsx`
- `v02/web/app/datenschutz/page.tsx`
- `v02/tests/e2e/review-auth.spec.ts`
- `v02/tests/e2e/public-smoke.spec.ts`
- `v02/scripts/audit-invariants.test.ts`

DELETE:

- keine

## Acceptance Criteria

- `/login` beschreibt Anmeldung fuer bestehende Nutzer und verweist auf Registrierung.
- `/register` beschreibt Kontoerstellung, Nutzen und Datenschutz ohne Zusatz-PII.
- Beide Formulare validieren nur HTML5-seitig und serverseitig durch Auth.js; leere oder ungueltige E-Mail verlaesst den Browser nicht als gueltige Submission.
- Beide Formulare nutzen dieselbe neutrale Erfolgsseite `/login/verify`.
- Login-Redirect nach erfolgreichem Magic-Link: `/profil`.
- Register-Redirect nach erfolgreichem Magic-Link: `/profil?welcome=1`.
- `/login/verify` nennt keine Existenzpruefung des Kontos und vermeidet Account-Enumeration.
- `/login/error` unterscheidet sichtbare Fehler nur in sicheren Kategorien: abgelaufen/ungueltig, Zugriff verweigert, Konfiguration, allgemein.
- `/profil` kann einen `welcome=1`-Hinweis anzeigen, ohne neue Daten zu speichern.
- Datenschutzseite sagt klar: E-Mail wird fuer Auth gespeichert, Feedback/Profil speichern keine Kontaktadresse.
- Top-Level-Navigation bleibt ohne Login nutzbar; Login/Register sind per Tastatur bedienbar und mit sichtbaren Labels versehen.

## Qualitaet

- Keine Secrets, keine Test-E-Mail-Adressen mit echten Domains in getrackten Dateien.
- Keine neue PII ausser der bestehenden Auth-E-Mail.
- Keine Account-Enumeration in UI-Texten, Logs oder Tests.
- Keine neue DB-Spalte.
- Codepfade nutzen kleine Pure-Helpers, damit Texte/Redirects testbar bleiben.
- Keine Mockdaten fuer Public Content.

## Tests

- `cd v02 && corepack pnpm exec tsx web/lib/auth-onboarding.test.ts`
- `cd v02 && corepack pnpm exec tsx scripts/audit-invariants.test.ts`
- `cd v02 && corepack pnpm run verify`
- `bash scripts/verify.sh`
- `cd v02 && corepack pnpm exec playwright test tests/e2e/public-smoke.spec.ts tests/e2e/review-auth.spec.ts`

## Optimierung

- Redirect-Ziele zentral halten, damit spaetere Passkey- oder Digest-Flows nicht mehrere Seiten anfassen.
- Onboarding-Texte kurz halten und an Haushaltsnutzen ausrichten.
- Wiederverwendbare Fehlertexte statt verstreuter Copy.
- E2E-Tests bleiben public/auth-focused, ohne echte Mails oder externe Resend-Abhaengigkeit.

## Rollback

Revert des Feature-Commits. Da keine Migration und keine neue Persistenz eingefuehrt wird, hat Rollback keine Datenwirkung.
