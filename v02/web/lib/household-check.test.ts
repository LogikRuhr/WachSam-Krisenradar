import assert from "node:assert/strict";
import { deriveHouseholdCheck, type HouseholdCheckChain } from "./household-check";

const mkChain = (id: string, bereich: string, severity: string, trend = "gleichbleibend"): HouseholdCheckChain => ({
  signal: {
    id,
    bereich,
    severity,
    trend,
    titel: `${bereich} Signal`,
    beschreibung: `${bereich} Beschreibung`,
  },
  impact: {
    kind: "cost",
    bereich,
    titel: `${bereich} Kosten`,
    beschreibung: `${bereich} Haushaltswirkung`,
    confidence: "mittel",
    zeithorizont: "wochen",
  },
  action: {
    titel: `${bereich} prüfen`,
    beschreibung: `${bereich} ruhig prüfen`,
    aufwand: "niedrig",
  },
});

const result = deriveHouseholdCheck({
  profile: { modus: "familie", heizart: "gas", plz: "45127" },
  chains: [mkChain("industrie", "industrie", "kritisch", "steigend"), mkChain("energie", "energie", "beobachten")],
});

assert.equal(result.relevant[0]?.signal.bereich, "energie", "Gas-Haushalt sieht Energie zuerst trotz niedrigerer Severity");
assert.equal(result.costOrSupply[0]?.impact?.bereich, "energie", "Kosten-/Versorgungsblock folgt der priorisierten Haushaltsrelevanz");
assert.ok(result.nextStep?.text.includes("Gas") || result.nextStep?.text.includes("gas"), "nächster Prüfschritt nutzt vorhandene Heizart-Checkliste");
assert.ok(result.boundary.includes("keine Beratung"), "Grenzhinweis nennt Beratungsausschluss");
assert.ok(result.privacy.includes("nicht gespeichert"), "Privacy-Hinweis stellt klar, dass anonyme Eingaben nicht gespeichert werden");

const empty = deriveHouseholdCheck({ profile: { modus: null, heizart: null, plz: null }, chains: [] });
assert.deepEqual(empty.relevant, [], "ohne Daten keine erfundenen relevanten Signale");
assert.equal(empty.nextStep?.key, "uni-abschlag", "ohne Profil bleibt nur universeller Prüfschritt");

console.log("household-check.test.ts: PASS");
