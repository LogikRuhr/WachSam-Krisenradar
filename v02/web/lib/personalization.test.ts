import assert from "node:assert/strict";
import { computeVerdict, isRising, personalNote, modusLead, trendLabel, bereichLabel, aufwandLabel, systemLabel, confidenceLabel, confidenceExplain, profileCompleteness, prioritizeActionsForProfile, householdRelevanceTier, prioritizeSignalsForProfile, householdCheckSteps, cascadePathNodes } from "./personalization";

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

// --- confidence: zentrales Label + verständliche Erklärung pro Stufe -----------

assert.equal(confidenceLabel("niedrig"), "Einschätzungssicherheit: niedrig");
assert.equal(confidenceLabel("hoch"), "Einschätzungssicherheit: hoch");
assert.equal(confidenceLabel("sonstig"), "Einschätzungssicherheit: sonstig", "unbekannte Stufe → mit Roh-Wert, nie leer");

assert.ok(confidenceExplain("niedrig").length > 0, "niedrig hat einen Erklärtext");
assert.ok(confidenceExplain("niedrig").includes("Quellen"), "Erklärung nennt die Quellenlage");
assert.notEqual(confidenceExplain("niedrig"), confidenceExplain("hoch"), "Stufen erklären sich unterschiedlich");
assert.ok(confidenceExplain(null).length > 0, "null → generischer Erklärtext, kein Crash");

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

// --- personalNote: Haushaltsbereiche differenzieren (Karten nicht identisch) ---

// Drei verschiedene Nicht-Energie-Haushaltsbereiche, gleicher Modus → drei
// verschiedene Notizen statt dreimal demselben generischen Modus-Satz.
const lmFam = personalNote("lebensmittel", { modus: "familie", heizart: null });
const moFam = personalNote("mobilitaet", { modus: "familie", heizart: null });
const fiFam = personalNote("finanzen", { modus: "familie", heizart: null });
assert.ok(lmFam && lmFam.includes("Lebensmittel"), "Lebensmittel-Bereich hat eigene Notiz");
assert.ok(moFam && /Mobilität|Wege|Sprit/.test(moFam), "Mobilität-Bereich hat eigene Notiz");
assert.ok(fiFam && /Finanz/.test(fiFam), "Finanzen-Bereich hat eigene Notiz");
assert.notEqual(lmFam, moFam, "verschiedene Bereiche → verschiedene Notizen");
assert.notEqual(lmFam, fiFam, "Lebensmittel ≠ Finanzen");
assert.notEqual(moFam, fiFam, "Mobilität ≠ Finanzen");

// Gleicher Bereich, anderer Modus → andere Betonung (nie dieselbe Notiz).
const lmSingle = personalNote("lebensmittel", { modus: "single", heizart: null });
assert.ok(lmSingle && lmSingle.includes("Lebensmittel"), "Single-Lebensmittel-Notiz nennt den Bereich");
assert.notEqual(lmFam, lmSingle, "gleicher Bereich, anderer Modus → andere Betonung");

// Nicht abgedeckter Bereich → ruhiger Fallback auf den generischen Modus-Lead.
assert.equal(
  personalNote("gesellschaft", { modus: "rentner", heizart: null }),
  modusLead("rentner"),
  "nicht abgedeckter Bereich → generischer Modus-Lead",
);

// Bereichsnotiz nur mit gesetztem Modus; ohne Profil weiterhin null.
assert.equal(personalNote("lebensmittel", { modus: null, heizart: null }), null, "Bereichsnotiz nur mit Modus");

// --- profileCompleteness: ehrliche Vollständigkeit ----------------------------

const voll = profileCompleteness({ modus: "familie", heizart: "gas" });
assert.equal(voll.filled, 2, "volles Profil → 2/2 ohne PLZ");
assert.equal(voll.total, 2);

const leer = profileCompleteness({ modus: null, heizart: null });
assert.equal(leer.filled, 0, "leeres Profil → 0/2");

const teil = profileCompleteness({ modus: "single", heizart: "unbekannt" });
assert.equal(teil.filled, 1, "heizart 'unbekannt' zählt nicht als gesetzt");
assert.equal(teil.fields.find((f) => f.key === "modus")?.set, true, "modus gesetzt");
assert.equal(teil.fields.find((f) => f.key === "heizart")?.set, false, "heizart 'unbekannt' = nicht gesetzt");
assert.equal(teil.fields.some((f) => (f.key as string) === "plz"), false, "PLZ ist kein Profil-Vollstaendigkeitsfeld mehr");

// --- prioritizeActionsForProfile: relevant zuerst, dann niedriger Aufwand ------

const acts = [
  { id: "a", aufwand: "hoch", bezugZuBereich: ["energie"] },
  { id: "b", aufwand: "niedrig", bezugZuBereich: ["finanzen"] },
  { id: "c", aufwand: "niedrig", bezugZuBereich: ["energie"] },
];
const mitHeiz = prioritizeActionsForProfile(acts, { heizart: "gas" });
assert.deepEqual(mitHeiz.map((a) => a.id), ["c", "a", "b"], "energie-Bezug zuerst (niedrig vor hoch), dann Rest");

const ohneHeiz = prioritizeActionsForProfile(acts, { heizart: "unbekannt" });
assert.deepEqual(ohneHeiz.map((a) => a.id), ["b", "c", "a"], "ohne Heizart: nur nach Aufwand, stabil");

assert.equal(prioritizeActionsForProfile(acts, { heizart: "gas" }, 2).length, 2, "limit greift");
assert.deepEqual(prioritizeActionsForProfile([], { heizart: "gas" }), [], "leere Liste → leer, kein Crash");

// --- householdRelevanceTier: profil-spitz < Haushalts-Kern < Rest --------------

assert.equal(householdRelevanceTier("energie", { heizart: "gas" }), 0, "Energie + Heizart → profil-spitz (0)");
assert.equal(householdRelevanceTier("energie", { heizart: "unbekannt" }), 1, "Energie ohne Heizart → nur Kern (1)");
assert.equal(householdRelevanceTier("lebensmittel", { heizart: null }), 1, "Lebensmittel → Haushalts-Kern (1)");
assert.equal(householdRelevanceTier("industrie", { heizart: "gas" }), 2, "Industrie → Rest (2)");

// --- prioritizeActionsForProfile: Haushalts-Kern schlägt Nicht-Kern ------------

const actsCore = [
  { id: "x", aufwand: "niedrig", bezugZuBereich: ["industrie"] }, // Nicht-Kern
  { id: "y", aufwand: "niedrig", bezugZuBereich: ["lebensmittel"] }, // Kern
];
assert.deepEqual(
  prioritizeActionsForProfile(actsCore, { heizart: "unbekannt" }).map((a) => a.id),
  ["y", "x"],
  "Haushalts-Kernbereich vor Nicht-Kern bei gleichem Aufwand",
);

// --- prioritizeSignalsForProfile: Relevanz-Tier, dann Severity -----------------

const chains = [
  { signal: { bereich: "industrie", severity: "kritisch", trend: "steigend" } }, // hohe Severity, Nicht-Kern
  { signal: { bereich: "energie", severity: "beobachten", trend: "gleichbleibend" } }, // profil-spitz bei Gas
];
assert.deepEqual(
  prioritizeSignalsForProfile(chains, { heizart: "gas" }).map((c) => c.signal.bereich),
  ["energie", "industrie"],
  "Gasheizer: Energie-Signal zuerst trotz niedrigerer Severity",
);
assert.deepEqual(
  prioritizeSignalsForProfile(chains, { heizart: "unbekannt" }).map((c) => c.signal.bereich),
  ["energie", "industrie"],
  "ohne Heizart: Energie (Kern) noch vor Industrie (Rest)",
);

const chainsTie = [
  { signal: { bereich: "finanzen", severity: "beobachten", trend: "gleichbleibend" } },
  { signal: { bereich: "lebensmittel", severity: "kritisch", trend: "steigend" } },
];
assert.deepEqual(
  prioritizeSignalsForProfile(chainsTie, { heizart: "unbekannt" }).map((c) => c.signal.bereich),
  ["lebensmittel", "finanzen"],
  "gleicher Tier → Severity entscheidet",
);
assert.equal(prioritizeSignalsForProfile([], { heizart: "gas" }).length, 0, "leer → leer, kein Crash");
assert.equal(prioritizeSignalsForProfile(chains, { heizart: "gas" }, 1).length, 1, "limit greift");

// --- householdCheckSteps: ruhige, abgeleitete Prüfschritte ohne Speicherung ----

const csGasFam = householdCheckSteps({ modus: "familie", heizart: "gas" });
assert.ok(csGasFam.some((s) => /Gas/.test(s.text)), "Gasheizer bekommt einen Gas-Prüfschritt");
assert.ok(csGasFam.some((s) => /Wocheneinkauf/.test(s.text)), "Familie bekommt einen Familien-Prüfschritt");
assert.ok(csGasFam.length >= 3, "Heizart + Modus + universell → mindestens 3");
assert.ok(csGasFam.every((s) => s.key && s.text), "jeder Schritt hat key + text");

const csLeer = householdCheckSteps({ modus: null, heizart: null });
assert.ok(csLeer.length >= 1, "ohne Profil mindestens universelle Schritte");

const csUnk = householdCheckSteps({ modus: "single", heizart: "unbekannt" });
assert.ok(!csUnk.some((s) => /Gas|Heizöl|Wärmepumpe/.test(s.text)), "heizart 'unbekannt' → kein heiz-spezifischer Schritt");

// --- cascadePathNodes: Lesespur mit korrekter, durchgehender Nummerierung ------

const pathWithDe = cascadePathNodes({
  trigger: "Ölpreis steigt",
  germanyRelevance: "Deutschland ist energieimportabhängig",
  steps: [{ description: "Spritpreise steigen", systems: ["mobilitaet"] }],
  householdImpact: "Tanken wird teurer",
});
assert.deepEqual(
  pathWithDe.map((n) => n.phase),
  ["entwicklung", "deutschlandRelevanz", "systembelastung", "haushalt"],
  "mit DE-Relevanz: vier Phasen in Reihenfolge",
);
assert.deepEqual(pathWithDe.map((n) => n.index), ["01", "02", "03", "04"], "fortlaufende Nummerierung inkl. DE-Knoten");
assert.deepEqual(
  pathWithDe.find((n) => n.phase === "systembelastung")?.systems,
  ["mobilitaet"],
  "Systeme am Systembelastungs-Schritt bleiben erhalten",
);

const pathNoDe = cascadePathNodes({
  trigger: "Ölpreis steigt",
  germanyRelevance: null,
  steps: [{ description: "Spritpreise steigen", systems: ["mobilitaet"] }],
  householdImpact: "Tanken wird teurer",
});
assert.deepEqual(
  pathNoDe.map((n) => n.phase),
  ["entwicklung", "systembelastung", "haushalt"],
  "ohne DE-Relevanz: DE-Knoten entfällt, Rest bleibt",
);
assert.deepEqual(pathNoDe.map((n) => n.index), ["01", "02", "03"], "Nummerierung ohne DE-Knoten");

const pathEmpty = cascadePathNodes({ trigger: "X", germanyRelevance: "   ", steps: [], householdImpact: "Y" });
assert.equal(
  pathEmpty.filter((n) => n.phase === "deutschlandRelevanz").length,
  0,
  "leere/whitespace DE-Relevanz → kein DE-Knoten",
);
assert.equal(
  pathEmpty.filter((n) => n.phase === "systembelastung").length,
  1,
  "ohne Steps → genau ein Platzhalter-Schritt, kein Crash",
);
assert.ok(pathEmpty.some((n) => n.phase === "haushalt"), "Haushalt-Knoten ist immer vorhanden");

console.log("personalization.test.ts: PASS");
