import assert from "node:assert/strict";
import { buildConfirmUrl } from "./auth-confirm";

// --- buildConfirmUrl: Pfad wird ersetzt ---------------------------------------

const localMagicLink =
  "http://localhost:3000/api/auth/callback/resend?callbackUrl=%2F&token=abc123&email=test%40example.com";
const localConfirm = new URL(buildConfirmUrl(localMagicLink));

assert.equal(localConfirm.pathname, "/login/confirm", "Pfad wird zu /login/confirm");
assert.equal(localConfirm.origin, "http://localhost:3000", "Origin (localhost) bleibt erhalten");
assert.equal(localConfirm.searchParams.get("token"), "abc123", "token bleibt erhalten");
assert.equal(localConfirm.searchParams.get("email"), "test@example.com", "email bleibt erhalten (dekodiert)");
assert.equal(localConfirm.searchParams.get("callbackUrl"), "/", "callbackUrl bleibt erhalten");

// --- buildConfirmUrl: Origin bleibt bei Produktions-Domain erhalten ----------

const prodMagicLink =
  "https://wachsam.ruhrlogik.de/api/auth/callback/resend?callbackUrl=%2Fadmin&token=tok-xyz&email=jean%40ruhrlogik.de";
const prodConfirm = new URL(buildConfirmUrl(prodMagicLink));

assert.equal(prodConfirm.origin, "https://wachsam.ruhrlogik.de", "Origin (Produktion) bleibt erhalten");
assert.equal(prodConfirm.pathname, "/login/confirm", "Pfad wird auch bei Produktions-Domain ersetzt");
assert.equal(prodConfirm.searchParams.get("callbackUrl"), "/admin", "callbackUrl bleibt erhalten (Produktion)");

// --- buildConfirmUrl: URL-Encoding / Sonderzeichen in der E-Mail -------------

const specialCharsLink =
  "https://wachsam.ruhrlogik.de/api/auth/callback/resend?callbackUrl=%2F&token=tok-1&email=user%2Btag%40example.de";
const specialCharsConfirm = new URL(buildConfirmUrl(specialCharsLink));

assert.equal(
  specialCharsConfirm.searchParams.get("email"),
  "user+tag@example.de",
  "'+' in der E-Mail bleibt nach dem Umbau korrekt dekodierbar",
);

// --- buildConfirmUrl: bestehende Query wird nicht dupliziert -----------------

const confirmed = buildConfirmUrl(localMagicLink);
const confirmedTwice = new URL(buildConfirmUrl(confirmed));

assert.equal(confirmedTwice.pathname, "/login/confirm", "erneutes Anwenden ändert den Pfad nicht mehr");
assert.deepEqual(
  [...confirmedTwice.searchParams.keys()].sort(),
  ["callbackUrl", "email", "token"],
  "Query-Parameter werden nicht verdoppelt",
);
assert.equal(confirmedTwice.searchParams.get("token"), "abc123", "token bleibt bei erneutem Aufruf identisch");

console.log("auth-confirm.test.ts: alle Assertions grün");
