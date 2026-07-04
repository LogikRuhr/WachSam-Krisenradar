import assert from "node:assert/strict";
import { valueAt } from "./weekly";

const DAY_MS = 24 * 60 * 60 * 1000;
const base = new Date("2026-01-01T00:00:00Z");
const addDays = (from: Date, days: number) => new Date(from.getTime() + days * DAY_MS);

// --- valueAt: jüngster Wert mit observedAt <= Stichtag (pure, keine DB) --------

const threePoints = [
  { observedAt: base, value: "1.0" },
  { observedAt: addDays(base, 5), value: "2.0" },
  { observedAt: addDays(base, 10), value: "3.0" },
];

// Stichtag zwischen 2. und 3. Punkt → 2. Wert
assert.equal(valueAt(threePoints, addDays(base, 7)), "2.0", "Stichtag zwischen Punkt 2 und 3 liefert Punkt 2");

// Stichtag exakt am 2. Punkt → inklusive, 2. Wert
assert.equal(valueAt(threePoints, addDays(base, 5)), "2.0", "Stichtag exakt am 2. Punkt ist inklusive");

// Stichtag vor allen Punkten → null (ehrlich: keine Historie statt erfundener Wert)
assert.equal(valueAt(threePoints, addDays(base, -1)), null, "Stichtag vor allen Punkten liefert null");

// Stichtag nach allen Punkten → jüngster (3.) Wert
assert.equal(valueAt(threePoints, addDays(base, 30)), "3.0", "Stichtag nach allen Punkten liefert jüngsten Wert");

// unsortierte Eingabe wird trotzdem korrekt ausgewertet (keine Sortier-Annahme)
const unsorted = [threePoints[2], threePoints[0], threePoints[1]];
assert.equal(valueAt(unsorted, addDays(base, 7)), "2.0", "unsortierte Liste liefert dasselbe Ergebnis");

// leere Liste → null
assert.equal(valueAt([], base), null, "leere Liste liefert null");

console.log("weekly.test.ts ok");
