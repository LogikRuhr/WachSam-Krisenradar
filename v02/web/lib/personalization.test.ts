import assert from "node:assert/strict";
import { computeVerdict, isRising, personalNote, trendLabel, bereichLabel, aufwandLabel, systemLabel } from "./personalization";

// --- computeVerdict ----------------------------------------------------------

assert.equal(computeVerdict([]).tone, "ruhig", "leere Liste → ruhig");

assert.equal(
  computeVerdict([{ severity: "stabil", bereich: "arbeit", trend: "gleichbleibend" }]).tone,
  "ruhig",
  "nur stabil → ruhig",
);

assert.equal(
  computeVerdict([{ severity: "erhoeht", bereich: "energie", trend: "steigend" }]).tone,
  "beobachten",
  "erhoeht → beobachten",
);

const angespannt = computeVerdict([
  { severity: "kritisch", bereich: "energie", trend: "steigend" },
  { severity: "beobachten", bereich: "finanzen", trend: "gleichbleibend" },
]);
assert.equal(angespannt.tone, "angespannt", "kritisch → angespannt");
assert.ok(angespannt.text.includes("Energie"), "Verdikt nennt Treiber-Bereich (Label)");
assert.ok(!angespannt.text.includes("energie"), "Verdikt nutzt Label, nicht roh-Token");

const ernst = computeVerdict([{ severity: "eskalierend", bereich: "lebensmittel", trend: "eskalierend" }]);
assert.equal(ernst.tone, "ernst", "eskalierend → ernst");

// --- isRising ----------------------------------------------------------------

assert.equal(isRising("steigend"), true);
assert.equal(isRising("eskalierend"), true);
assert.equal(isRising("gleichbleibend"), false);

// --- labels ------------------------------------------------------------------

assert.equal(bereichLabel("mobilitaet"), "Mobilität");
assert.equal(trendLabel("steigend"), "steigt");
assert.equal(trendLabel("gleichbleibend"), "stabil");

// --- aufwandLabel: deutsche Anzeige statt roher Slug ---------------------------

assert.equal(aufwandLabel("niedrig"), "Niedrig", "niedrig → Niedrig (kein roher Slug in der UI)");
assert.equal(aufwandLabel("mittel"), "Mittel");
assert.equal(aufwandLabel("hoch"), "Hoch");
assert.equal(aufwandLabel("sonstiges"), "sonstiges", "unbekannter Aufwand → unverändert, nie leer");

// --- systemLabel: eine Quelle der Wahrheit für Systembereiche ------------------

assert.equal(systemLabel("mobilitaet"), "Mobilität", "systemLabel deckt Bereiche identisch zu bereichLabel ab");
assert.equal(systemLabel("energie"), "Energie");
assert.equal(systemLabel("gesellschaft"), "Gesellschaft");
assert.equal(systemLabel("nicht-vorhanden"), "nicht-vorhanden", "unbekanntes System → Roh-Wert als Fallback, kein Crash");

// --- personalNote: heizart differenziert NUR bei Energie ---------------------

const gas = personalNote("energie", { modus: "familie", heizart: "gas" });
assert.ok(gas && gas.includes("Gas"), "Gasheizer sieht Gas-zugespitzte Energie-Notiz");

const strom = personalNote("energie", { modus: "familie", heizart: "strom" });
assert.ok(strom && strom.includes("Strompreis"), "Stromheizer sieht Strom-Notiz");
assert.notEqual(gas, strom, "Gas- und Stromheizer sehen unterschiedliche Energie-Notiz");

// Nicht-Energie-Signal → Heizart egal, Modus entscheidet
const finanzen = personalNote("finanzen", { modus: "single", heizart: "gas" });
assert.ok(finanzen && finanzen.includes("Single"), "Nicht-Energie nutzt Modus, nicht Heizart");

// Ohne Profil → keine Notiz
assert.equal(personalNote("energie", { modus: null, heizart: null }), null, "ohne Profil keine Notiz");
assert.equal(personalNote("energie", { modus: null, heizart: "unbekannt" }), null, "heizart unbekannt + kein Modus → null");

console.log("personalization.test.ts: PASS");
