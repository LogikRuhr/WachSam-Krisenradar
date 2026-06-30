import assert from "node:assert/strict";
import { buildPriceRadar } from "./price-radar";

const baseIndicator = {
  previousValue: null,
  currentValueDate: new Date("2026-06-29T00:00:00Z"),
  thresholdWarn: null,
  thresholdCritical: null,
  scaleDirection: "higher_is_worse",
  zoneTextUncritical: null,
  zoneTextElevated: null,
  zoneTextCritical: null,
};

const cards = buildPriceRadar(
  [
    {
      ...baseIndicator,
      id: "wi-kraftstoffpreis-super-e5",
      label: "Kraftstoffpreis Super E5 Deutschland",
      unit: "Euro/Liter",
      currentValue: "1.829",
    },
    {
      ...baseIndicator,
      id: "wi-kraftstoffpreis-super-e10",
      label: "Kraftstoffpreis Super E10 Deutschland",
      unit: "Euro/Liter",
      currentValue: "1.769",
      thresholdWarn: "1.63",
      thresholdCritical: "1.86",
    },
    {
      ...baseIndicator,
      id: "wi-strompreis-haushalt",
      label: "Strompreis Haushalte Deutschland",
      unit: "ct/kWh",
      currentValue: "37",
    },
  ],
  [
    {
      sourceName: "Tankerkoenig",
      target: "indicators",
      status: "error",
      lastSuccessAt: null,
      lastCheckedAt: new Date("2026-06-29T08:00:00Z"),
      itemCount: 0,
      errorCount: 1,
    },
  ],
);

assert.deepEqual(
  cards.filter((card) => card.group === "fuel").map((card) => card.label),
  ["Super E5", "Super E10", "Diesel"],
  "price radar must include the common station fuel types",
);

const e5 = cards.find((card) => card.id === "wi-kraftstoffpreis-super-e5");
assert.ok(e5, "Super E5 card must exist");
assert.equal(e5.value, 1.829, "Super E5 value must use the indicator value");
assert.equal(e5.zone, null, "Super E5 must not invent a zone without calibrated thresholds");
assert.match(e5.sourceNote, /Stichprobe/, "fuel cards must disclose the sample basis");
assert.equal(e5.sourceStatusLabel, "Quellenfehler", "fuel cards must expose source health");

const diesel = cards.find((card) => card.id === "wi-kraftstoffpreis-diesel");
assert.ok(diesel, "Diesel card must exist even when the DB row is missing");
assert.equal(diesel.pending, true, "missing Diesel value must be a pending state");
assert.equal(diesel.value, null, "missing Diesel value must not be faked");

const strom = cards.find((card) => card.id === "wi-strompreis-haushalt");
assert.ok(strom, "Strom household card must exist");
assert.equal(strom.value, 37, "Strom card must use the BDEW editorial value");
assert.equal(strom.sourceStatusLabel, "Redaktioneller Stand", "BDEW card must not pretend to be live");

console.log("price-radar.test.ts: PASS");
