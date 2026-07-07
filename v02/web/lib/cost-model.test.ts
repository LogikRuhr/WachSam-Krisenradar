import assert from "node:assert/strict";
import { estimateHeatingDelta, estimateHeatingRange, estimateMobilityDelta, estimateMobilityRange } from "./cost-model";

const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (base: Date, days: number) => new Date(base.getTime() + days * DAY_MS);
const base = new Date("2026-01-01T00:00:00Z");

// --- estimateMobilityDelta: Diesel, Annahme 15.000 km/Jahr, 6,5 l/100 km --------

// 35-Tage-Fenster, 1.70 → 1.80 €/l: 0.10 * 81.25 * 30/35 ≈ 6.96 → gerundet 7
{
  const obs = [
    { observedAt: base, value: "1.70" },
    { observedAt: addDays(base, 35), value: "1.80" },
  ];
  const estimate = estimateMobilityDelta(obs);
  assert.ok(estimate, "35-Tage-Fenster liefert eine Schätzung");
  assert.equal(estimate!.monthlyDeltaEur, 7, "0.10 * 81.25 * 30/35 ≈ 6.96 → 7");
  assert.equal(estimate!.window, "35 Tage", "Fenster wird als Tage-Text ausgewiesen");
  assert.match(estimate!.assumptions, /15\.000 km\/Jahr/, "Annahmen ausgeschrieben");
}

{
  const obs = [
    { observedAt: base, value: "1.70" },
    { observedAt: addDays(base, 30), value: "1.80" },
  ];
  const estimate = estimateMobilityRange(obs, {
    min: 60,
    max: 120,
    label: "Familienhaushalt, redaktionelle Modellbandbreite",
  });
  assert.ok(estimate, "30-Tage-Fenster liefert eine Mobilitaets-Spanne");
  assert.equal(estimate!.monthlyDeltaMinEur, 6, "0.10 * 60 l = 6 EUR");
  assert.equal(estimate!.monthlyDeltaMaxEur, 12, "0.10 * 120 l = 12 EUR");
  assert.match(estimate!.assumptions, /60-120 l\/Monat/, "Bandbreite wird ausgeschrieben");
}

// Fallender Preis liefert korrektes Vorzeichen (negatives Delta)
{
  const obs = [
    { observedAt: base, value: "1.80" },
    { observedAt: addDays(base, 30), value: "1.70" },
  ];
  const estimate = estimateMobilityDelta(obs);
  assert.ok(estimate, "30-Tage-Fenster liefert eine Schätzung");
  assert.equal(estimate!.monthlyDeltaEur, -8, "fallender Preis → negatives Delta");

  const range = estimateMobilityRange(obs, { min: 60, max: 120, label: "Familienhaushalt" });
  assert.ok(range, "fallender Preis liefert eine Spanne");
  assert.equal(range!.monthlyDeltaMinEur, -12, "kleinerer Wert bleibt min");
  assert.equal(range!.monthlyDeltaMaxEur, -6, "groesserer Wert bleibt max");
}

// Zu kurzes Fenster (10 Tage < 21 Tage Minimum) → null, ehrlich keine €-Zeile
{
  const obs = [
    { observedAt: base, value: "1.70" },
    { observedAt: addDays(base, 10), value: "1.80" },
  ];
  assert.equal(estimateMobilityDelta(obs), null, "zu kurzes Fenster → null");
}

// Zu langes Fenster (60 Tage > 45 Tage Maximum) → null statt überzeichneter Monatswert
{
  const obs = [
    { observedAt: base, value: "1.70" },
    { observedAt: addDays(base, 60), value: "1.80" },
  ];
  assert.equal(estimateMobilityDelta(obs), null, "zu langes Fenster → null");
}

// Weniger als 2 verwertbare Punkte → null
assert.equal(estimateMobilityDelta([]), null, "leere Liste → null");
assert.equal(estimateMobilityDelta([{ observedAt: base, value: "1.70" }]), null, "ein Punkt → null");
assert.equal(
  estimateMobilityDelta([
    { observedAt: base, value: "n/a" },
    { observedAt: addDays(base, 35), value: "1.80" },
  ]),
  null,
  "nicht-numerischer Wert wird verworfen → nur noch 1 verwertbarer Punkt → null",
);

// --- estimateHeatingDelta: Gaspreis Haushalt, Einheit ct/kWh (verifiziert) ------

// 30-Tage-Fenster, 10.0 → 11.0 ct/kWh: 1.0 ct * 1.500 kWh / 100 = 15
{
  const obs = [
    { observedAt: base, value: "10.0" },
    { observedAt: addDays(base, 30), value: "11.0" },
  ];
  const estimate = estimateHeatingDelta(obs, "ct/kWh");
  assert.ok(estimate, "ct/kWh-Fenster liefert eine Schätzung");
  assert.equal(estimate!.monthlyDeltaEur, 15, "1.0 ct/kWh * 1.500 kWh / 100 = 15");
  assert.match(estimate!.assumptions, /18\.000 kWh\/Jahr/, "Annahmen ausgeschrieben");

  const range = estimateHeatingRange(obs, "ct/kWh", {
    min: 1200,
    max: 2200,
    label: "Familienhaushalt, redaktionelle Modellbandbreite",
  });
  assert.ok(range, "ct/kWh-Fenster liefert eine Heiz-Spanne");
  assert.equal(range!.monthlyDeltaMinEur, 12, "1.0 ct/kWh * 1.200 kWh / 100 = 12");
  assert.equal(range!.monthlyDeltaMaxEur, 22, "1.0 ct/kWh * 2.200 kWh / 100 = 22");
  assert.match(range!.assumptions, /1200-2200 kWh\/Monat/, "Heiz-Bandbreite wird ausgeschrieben");
}

// Unbekannte/fehlende Einheit → null (keine stille Fehlannahme über den Faktor)
{
  const obs = [
    { observedAt: base, value: "10.0" },
    { observedAt: addDays(base, 30), value: "11.0" },
  ];
  assert.equal(estimateHeatingDelta(obs, "€/kWh-unbekannt"), null, "unbekannte Einheit → null");
  assert.equal(
    estimateHeatingRange(obs, "€/kWh-unbekannt", { min: 1200, max: 2200, label: "Familienhaushalt" }),
    null,
    "unbekannte Einheit → null auch fuer Spannen",
  );
  assert.equal(estimateHeatingDelta(obs, null), null, "fehlende Einheit → null");
}

// Zu kurzes Fenster → null
{
  const obs = [
    { observedAt: base, value: "10.0" },
    { observedAt: addDays(base, 5), value: "11.0" },
  ];
  assert.equal(estimateHeatingDelta(obs, "ct/kWh"), null, "zu kurzes Fenster → null");
}

assert.equal(estimateHeatingDelta([], "ct/kWh"), null, "leere Liste → null");

console.log("cost-model.test.ts ok");
