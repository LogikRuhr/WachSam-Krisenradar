import assert from "node:assert/strict";
import { parseFeedbackInput } from "./feedback";

// --- Gültige Minimaleingabe: Kategorie-Default, getrimmte Nachricht ------------

const ok = parseFeedbackInput({ message: "Sehr hilfreiche Einordnung." });
assert.equal(ok.ok, true, "valide Minimaleingabe");
assert.equal(ok.ok && ok.data.category, "sonstiges", "fehlende Kategorie → Default sonstiges");
assert.equal(ok.ok && ok.data.rating, undefined, "kein Rating → undefined");
assert.equal(ok.ok && ok.data.contactEmail, undefined, "keine E-Mail → undefined");

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

// --- Kontakt-E-Mail (freiwillig) ------------------------------------------------

const withMail = parseFeedbackInput({ message: "passt schon", contactEmail: "a@b.de" });
assert.equal(withMail.ok && withMail.data.contactEmail, "a@b.de", "gültige E-Mail bleibt erhalten");
assert.equal(parseFeedbackInput({ message: "passt schon", contactEmail: "keine-mail" }).ok, false, "ungültige E-Mail → Fehler");
const emptyMail = parseFeedbackInput({ message: "passt schon", contactEmail: "" });
assert.equal(emptyMail.ok, true, "leere E-Mail erlaubt");
assert.equal(emptyMail.ok && emptyMail.data.contactEmail, undefined, "leere E-Mail → undefined (nicht gespeichert)");

// --- Honeypot -------------------------------------------------------------------

assert.equal(parseFeedbackInput({ message: "passt schon", website: "http://spam" }).ok, false, "gefülltes Honeypot → abgelehnt");
assert.equal(parseFeedbackInput({ message: "passt schon", website: "" }).ok, true, "leeres Honeypot → ok");

// --- pagePath -------------------------------------------------------------------

const withPath = parseFeedbackInput({ message: "passt schon", pagePath: "/lage" });
assert.equal(withPath.ok && withPath.data.pagePath, "/lage", "pagePath bleibt erhalten");

console.log("feedback.test.ts: PASS");
