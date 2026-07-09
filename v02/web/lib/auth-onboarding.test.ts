import assert from "node:assert/strict";
import {
  authRedirectForIntent,
  getAuthErrorCopy,
  getAuthPageCopy,
  getVerifyRequestCopy,
} from "./auth-onboarding";

assert.equal(authRedirectForIntent("login"), "/profil", "Login fuehrt nach Magic-Link in den persoenlichen Bereich");
assert.equal(
  authRedirectForIntent("register"),
  "/profil?welcome=1",
  "Registrierung startet nach Magic-Link das Profil-Onboarding",
);

const loginCopy = getAuthPageCopy("login");
assert.equal(loginCopy.title, "Anmelden", "Login bleibt als Anmeldung erkennbar");
assert.match(loginCopy.lead, /bestehendes Konto/i, "Login spricht bestehende Nutzer an");
assert.equal(loginCopy.secondaryHref, "/register", "Login verweist auf Registrierung");
assert.doesNotMatch(loginCopy.lead, /existiert|gefunden/i, "Login-Copy vermeidet Account-Enumeration");

const registerCopy = getAuthPageCopy("register");
assert.equal(registerCopy.title, "Konto anlegen", "Register bleibt als Kontoerstellung erkennbar");
assert.match(registerCopy.lead, /Magic-Link/i, "Register erklaert passwortlosen Login");
assert.equal(registerCopy.secondaryHref, "/login", "Register verweist auf Login");
assert.ok(registerCopy.privacyNote, "Register liefert einen Datenschutz-Hinweis");
assert.match(registerCopy.privacyNote, /E-Mail-Adresse.*Anmeldung/i, "Register erklaert Auth-E-Mail zweckgebunden");
assert.match(registerCopy.privacyNote, /keine Kontaktadresse/i, "Register grenzt Feedback-Kontaktadressen aus");
assert.doesNotMatch(registerCopy.privacyNote, /Tracking|Ads/i, "Register fuehrt keine Tracking- oder Ads-Claims ein");

const verifyCopy = getVerifyRequestCopy();
assert.match(verifyCopy.lead, /falls die Adresse genutzt werden kann/i, "Verify-Copy vermeidet Account-Enumeration");
assert.doesNotMatch(verifyCopy.lead, /Konto gefunden|registriert|existiert/i, "Verify-Copy bestaetigt kein Konto");

assert.equal(getAuthErrorCopy("Verification").title, "Link konnte nicht geprüft werden");
assert.match(getAuthErrorCopy("AccessDenied").lead, /Zugriff/i, "AccessDenied bleibt generisch");
assert.match(getAuthErrorCopy("Configuration").lead, /vorübergehend/i, "Konfigurationsfehler leakt keine Interna");
assert.equal(getAuthErrorCopy("unexpected").kind, "default", "Unbekannte Fehler fallen auf Default zurueck");

console.log("auth-onboarding.test.ts: PASS");
