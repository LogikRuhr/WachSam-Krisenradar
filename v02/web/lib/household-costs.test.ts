import assert from "node:assert/strict";
import { deriveHouseholdCostView, type HouseholdCostInput } from "./household-costs";

const inputs: HouseholdCostInput[] = [
  {
    id: "wi-kraftstoffpreis-diesel",
    label: "Diesel",
    unit: "€/l",
    sourceName: "Tankerkoenig",
    currentValueDate: "2026-07-01T00:00:00.000Z",
    observations: [
      { observedAt: "2026-06-01T00:00:00.000Z", value: "1.70" },
      { observedAt: "2026-07-01T00:00:00.000Z", value: "1.80" },
    ],
  },
  {
    id: "wi-gaspreis-haushalt-efh",
    label: "Gas Haushalte",
    unit: "ct/kWh",
    sourceName: "Destatis",
    currentValueDate: "2026-07-01T00:00:00.000Z",
    observations: [
      { observedAt: "2026-06-01T00:00:00.000Z", value: "10.0" },
      { observedAt: "2026-07-01T00:00:00.000Z", value: "11.0" },
    ],
  },
];

{
  const view = deriveHouseholdCostView({ profile: { modus: "familie", heizart: "gas" }, inputs });
  assert.equal(view.ranges.length, 2, "Familie mit Gas bekommt Mobilitaets- und Heizkosten-Spanne");
  assert.equal(view.unavailable.length, 0, "keine Leerzustaende bei belastbaren Daten");

  const mobility = view.ranges.find((range) => range.key === "mobility");
  assert.equal(mobility?.amountMinEur, 6, "Familien-Mobilitaet nutzt 60 l/Monat als Untergrenze");
  assert.equal(mobility?.amountMaxEur, 12, "Familien-Mobilitaet nutzt 120 l/Monat als Obergrenze");
  assert.match(mobility?.assumptions ?? "", /redaktionelle Modellbandbreite/, "Annahmen bleiben sichtbar");

  const heating = view.ranges.find((range) => range.key === "heating");
  assert.equal(heating?.amountMinEur, 12, "Gas nutzt 1.200 kWh/Monat als Untergrenze");
  assert.equal(heating?.amountMaxEur, 22, "Gas nutzt 2.200 kWh/Monat als Obergrenze");
  assert.equal(heating?.sourceName, "Destatis", "Quelle bleibt an der Spanne");
}

{
  const view = deriveHouseholdCostView({ profile: { modus: "single", heizart: "unbekannt" }, inputs });
  assert.equal(view.ranges.some((range) => range.key === "mobility"), true, "Mobilitaet bleibt ohne Heizart sichtbar");
  assert.equal(view.unavailable[0]?.key, "heating", "Heizen wird nicht erfunden");
  assert.match(view.unavailable[0]?.reason ?? "", /Heizart wählen/, "Leerzustand fordert konkrete Auswahl");
}

{
  const view = deriveHouseholdCostView({ profile: { modus: "rentner", heizart: "fernwaerme" }, inputs });
  assert.equal(view.ranges.some((range) => range.key === "heating"), false, "Nicht-Gas-Heizart erhaelt keine falsche Gas-Spanne");
  assert.match(view.unavailable.find((item) => item.key === "heating")?.reason ?? "", /Fernwärme/, "Leerzustand benennt Heizart");
}

{
  const view = deriveHouseholdCostView({
    profile: { modus: "familie", heizart: "gas" },
    inputs: inputs.map((input) => ({ ...input, observations: input.observations.slice(0, 1) })),
  });
  assert.deepEqual(view.ranges, [], "zu kurze Zeitreihen erzeugen keine Spannen");
  assert.equal(view.unavailable.length, 2, "fehlende Vergleichsfenster bleiben sichtbar");
}

console.log("household-costs.test.ts: PASS");
