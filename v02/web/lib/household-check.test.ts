import assert from "node:assert/strict";
import { deriveHouseholdCheck, type HouseholdCheckChain } from "./household-check";

const mkChain = (
  id: string,
  bereich: string,
  severity: string,
  trend = "gleichbleibend",
  options: { hasImpact?: boolean } = {},
): HouseholdCheckChain => ({
  signal: {
    id,
    bereich,
    severity,
    trend,
    titel: `${bereich} Signal`,
    beschreibung: `${bereich} Beschreibung`,
  },
  impact:
    options.hasImpact === false
      ? null
      : {
          kind: "cost",
          bereich,
          titel: `${bereich} Kosten`,
          beschreibung: `${bereich} Haushaltswirkung`,
          confidence: "mittel",
          zeithorizont: "wochen",
        },
  action:
    options.hasImpact === false && id.endsWith("no-action")
      ? null
      : {
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
assert.equal(result.primaryConcern?.signal.bereich, "energie", "Cockpit-Zusammenfassung nutzt die erste Haushaltsprioritaet");
assert.equal(result.primaryImpact?.impact?.bereich, "energie", "Cockpit-Zusammenfassung nutzt die erste konkrete Haushaltswirkung");
assert.equal(result.primaryAction?.action?.titel, "energie prüfen", "Cockpit-Zusammenfassung nutzt eine passende echte Massnahme");
assert.equal(result.secondaryRelevant.length, 1, "kompakte Details zeigen nur weitere priorisierte Treffer");
assert.equal(result.secondaryCostOrSupply.length, 1, "kompakte Details zeigen nur weitere Kosten-/Versorgungswirkungen");
assert.ok(result.nextStep?.text.includes("Gas") || result.nextStep?.text.includes("gas"), "nächster Prüfschritt nutzt vorhandene Heizart-Checkliste");
assert.ok(result.boundary.includes("keine Beratung"), "Grenzhinweis nennt Beratungsausschluss");
assert.ok(result.privacy.includes("nicht gespeichert"), "Privacy-Hinweis stellt klar, dass anonyme Eingaben nicht gespeichert werden");

const many = deriveHouseholdCheck({
  profile: { modus: "familie", heizart: "unbekannt", plz: null },
  chains: [
    mkChain("energy", "energie", "kritisch", "steigend"),
    mkChain("food", "lebensmittel", "kritisch"),
    mkChain("mobility", "mobilitaet", "erhoeht", "steigend"),
    mkChain("finance", "finanzen", "beobachten"),
    mkChain("industry", "industrie", "kritisch", "steigend"),
  ],
});

assert.equal(many.relevant.length, 3, "sichtbare Hauptrelevanz bleibt auf drei echte Ketten begrenzt");
assert.equal(many.costOrSupply.length, 3, "Kosten-/Versorgungsdetails bleiben auf drei echte Ketten begrenzt");
assert.equal(many.secondaryRelevant.length, 2, "Detail-Relevanz laesst die Primaerkarte aus und bleibt kompakt");
assert.equal(many.secondaryCostOrSupply.length, 2, "Detail-Wirkungen lassen die Primaerwirkung aus und bleiben kompakt");
assert.equal(many.notDirectlyRelevant.length, 2, "indirekte Treffer bleiben begrenzt");

const lateImpact = deriveHouseholdCheck({
  profile: { modus: "single", heizart: "unbekannt", plz: null },
  chains: [
    mkChain("energy-no-impact", "energie", "kritisch", "steigend", { hasImpact: false }),
    mkChain("food-no-impact", "lebensmittel", "kritisch", "gleichbleibend", { hasImpact: false }),
    mkChain("mobility-no-impact", "mobilitaet", "erhoeht", "steigend", { hasImpact: false }),
    mkChain("finance-impact", "finanzen", "beobachten"),
  ],
});

assert.equal(lateImpact.relevant.length, 3, "Top-3 Lagekarten bleiben ohne spaeten Nachruecker stabil");
assert.equal(lateImpact.primaryConcern?.signal.id, "energy-no-impact", "primaere Lagekarte bleibt der erste Haushalts-Treffer");
assert.equal(lateImpact.primaryImpact?.signal.id, "finance-impact", "erste echte Haushaltswirkung darf auch nach den Top-3 kommen");
assert.equal(lateImpact.primaryAction?.signal.id, "energy-no-impact", "primaere Massnahme folgt zuerst der Haushaltsprioritaet");
assert.equal(lateImpact.costOrSupply.length, 1, "spaete echte Haushaltswirkung wird nicht ausgeblendet");

const lateAction = deriveHouseholdCheck({
  profile: { modus: "single", heizart: "unbekannt", plz: null },
  chains: [
    mkChain("energy-no-action", "energie", "kritisch", "steigend", { hasImpact: false }),
    mkChain("food-no-action", "lebensmittel", "kritisch", "gleichbleibend", { hasImpact: false }),
    mkChain("finance-action", "finanzen", "beobachten"),
  ],
});

assert.equal(lateAction.primaryAction?.signal.id, "finance-action", "wenn Top-Signale keine Massnahme haben, wird die naechste echte Massnahme genutzt");

const empty = deriveHouseholdCheck({ profile: { modus: null, heizart: null, plz: null }, chains: [] });
assert.deepEqual(empty.relevant, [], "ohne Daten keine erfundenen relevanten Signale");
assert.deepEqual(empty.costOrSupply, [], "ohne Daten keine erfundenen Kosten- oder Versorgungswirkungen");
assert.deepEqual(empty.secondaryRelevant, [], "ohne Daten keine erfundenen Detailtreffer");
assert.deepEqual(empty.secondaryCostOrSupply, [], "ohne Daten keine erfundenen Detailwirkungen");
assert.deepEqual(empty.notDirectlyRelevant, [], "ohne Daten keine indirekten Platzhalter");
assert.equal(empty.primaryConcern, null, "ohne Daten gibt es keine erfundene primaere Lagekarte");
assert.equal(empty.primaryImpact, null, "ohne Daten gibt es keine erfundene primaere Haushaltswirkung");
assert.equal(empty.primaryAction, null, "ohne Daten gibt es keine erfundene Massnahme");
assert.equal(empty.nextStep?.key, "uni-abschlag", "ohne Profil bleibt nur universeller Prüfschritt");

console.log("household-check.test.ts: PASS");
