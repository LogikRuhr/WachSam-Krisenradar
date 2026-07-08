import assert from "node:assert/strict";
import { parseFeedbackInput } from "./feedback";

function assertNoContactEmail(data: object, message: string) {
  assert.equal(Object.prototype.hasOwnProperty.call(data, "contactEmail"), false, message);
}

// --- Gültige Minimaleingabe: Kategorie-Default, getrimmte Nachricht ------------

const ok = parseFeedbackInput({ message: "Sehr hilfreiche Einordnung." });
assert.equal(ok.ok, true, "valide Minimaleingabe");
assert.equal(ok.ok && ok.data.category, "sonstiges", "fehlende Kategorie → Default sonstiges");
assert.equal(ok.ok && ok.data.rating, undefined, "kein Rating → undefined");
if (ok.ok) assertNoContactEmail(ok.data, "FeedbackData enthält kein contactEmail");

const trimmed = parseFeedbackInput({ message: "   knapp daneben   " });
assert.equal(trimmed.ok && trimmed.data.message, "knapp daneben", "Nachricht wird getrimmt");

// --- Nachricht: Länge -----------------------------------------------------------

assert.equal(parseFeedbackInput({ message: "ab" }).ok, false, "Nachricht < 3 Zeichen → Fehler");
assert.equal(parseFeedbackInput({ message: "   " }).ok, false, "nur Whitespace → Fehler");
assert.equal(parseFeedbackInput({ message: "x".repeat(4001) }).ok, false, "Nachricht > 4000 → Fehler");

// --- Kategorie ------------------------------------------------------------------

assert.equal(parseFeedbackInput({ message: "passt schon", category: "idee" }).ok, true, "gültige Kategorie");
assert.equal(parseFeedbackInput({ message: "passt schon", category: "quatsch" }).ok, false, "ungültige Kategorie → Fehler");

// --- Rating ---------------------------------------------------------------------

const rated = parseFeedbackInput({ message: "passt schon", rating: 4 });
assert.equal(rated.ok && rated.data.rating, 4, "gültiges Rating bleibt erhalten");
assert.equal(parseFeedbackInput({ message: "passt schon", rating: 9 }).ok, false, "Rating > 5 → Fehler");
assert.equal(parseFeedbackInput({ message: "passt schon", rating: 0 }).ok, false, "Rating < 1 → Fehler");
assert.equal(parseFeedbackInput({ message: "passt schon", rating: 2.5 }).ok, false, "Rating nicht ganzzahlig → Fehler");

// --- Kontakt-E-Mail wird als unbekanntes Feld ignoriert -------------------------

const withIgnoredMail = parseFeedbackInput({ message: "passt schon", contactEmail: "keine-mail" });
assert.equal(withIgnoredMail.ok, true, "contactEmail wird nicht validiert");
if (withIgnoredMail.ok) {
  assertNoContactEmail(withIgnoredMail.data, "contactEmail wird nicht zurückgegeben");
}

// --- Honeypot -------------------------------------------------------------------

assert.equal(parseFeedbackInput({ message: "passt schon", website: "http://spam" }).ok, false, "gefülltes Honeypot → abgelehnt");
assert.equal(parseFeedbackInput({ message: "passt schon", website: "" }).ok, true, "leeres Honeypot → ok");

// --- pagePath -------------------------------------------------------------------

const withPath = parseFeedbackInput({ message: "passt schon", pagePath: "/lage" });
assert.equal(withPath.ok && withPath.data.pagePath, "/lage", "pagePath bleibt erhalten");

console.log("feedback.test.ts: PASS");
