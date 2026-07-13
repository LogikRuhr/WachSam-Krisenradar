import assert from "node:assert/strict";
import { isAllowlistedAdmin, parseAdminEmails } from "./admin-allowlist";

// --- parseAdminEmails: Normalisierung -----------------------------------------

assert.deepEqual(parseAdminEmails(undefined), [], "undefined → leere Liste");
assert.deepEqual(parseAdminEmails(""), [], "leerer String → leere Liste");
assert.deepEqual(parseAdminEmails("  "), [], "nur Whitespace → leere Liste");
assert.deepEqual(
  parseAdminEmails("A@Example.de, b@example.de ,, c@x.de"),
  ["a@example.de", "b@example.de", "c@x.de"],
  "trimmt, lowercased, verwirft leere Einträge",
);

// --- isAllowlistedAdmin: Treffer ----------------------------------------------

assert.equal(isAllowlistedAdmin("jean@ruhrlogik.de", "jean@ruhrlogik.de"), true, "exakter Treffer");
assert.equal(
  isAllowlistedAdmin("JEAN@Ruhrlogik.DE", "jean@ruhrlogik.de"),
  true,
  "Groß-/Kleinschreibung egal",
);
assert.equal(
  isAllowlistedAdmin(" jean@ruhrlogik.de ", "jean@ruhrlogik.de"),
  true,
  "Whitespace um die E-Mail toleriert",
);
assert.equal(
  isAllowlistedAdmin("b@example.de", "a@example.de, b@example.de"),
  true,
  "Treffer in mehrteiliger Liste",
);

// --- isAllowlistedAdmin: kein Treffer -----------------------------------------

assert.equal(isAllowlistedAdmin("fremd@example.de", "jean@ruhrlogik.de"), false, "nicht gelistet");
assert.equal(isAllowlistedAdmin("jean@ruhrlogik.de", ""), false, "leere Allowlist → nie Admin");
assert.equal(isAllowlistedAdmin("jean@ruhrlogik.de", undefined), false, "fehlende Env → nie Admin");
assert.equal(isAllowlistedAdmin(undefined, "jean@ruhrlogik.de"), false, "keine E-Mail → false");
assert.equal(isAllowlistedAdmin(null, "jean@ruhrlogik.de"), false, "null-E-Mail → false");
assert.equal(isAllowlistedAdmin("", "jean@ruhrlogik.de"), false, "leere E-Mail → false");

console.log("admin-allowlist.test.ts: alle Assertions grün");
