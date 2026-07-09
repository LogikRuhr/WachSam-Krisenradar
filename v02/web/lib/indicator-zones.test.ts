import assert from "node:assert/strict";
import { computeInjectionPeriod } from "./indicator-zones";

const now = new Date("2026-07-09T00:00:00Z");

const active = computeInjectionPeriod(70, 69, 80, new Date("2026-07-19T00:00:00Z"), now);
assert.ok(active, "aktive Einspeisungsperiode liefert Metriken");
assert.equal(active.daysRemaining, 10, "Resttage werden aufgerundet");
assert.equal(active.gapToTarget, 10, "offene Luecke wird berechnet");
assert.equal(active.requiredDailyRate, 1, "aktive Frist liefert taegliche Zielrate");
assert.equal(active.onTrack, true, "tatsaechliche Veraenderung >= Zielrate ist auf Kurs");

const expiredReached = computeInjectionPeriod(81, 80, 80, new Date("2026-07-01T00:00:00Z"), now);
assert.ok(expiredReached, "abgelaufene Frist mit erreichtem Ziel liefert Metriken");
assert.equal(expiredReached.periodActive, false, "Frist ist abgelaufen");
assert.equal(expiredReached.gapToTarget, 0, "keine offene Luecke");
assert.equal(expiredReached.requiredDailyRate, 0, "keine nicht-endliche Rate bei erreichtem Ziel");
assert.equal(expiredReached.onTrack, true, "erreichtes Ziel bleibt auf Kurs");

const expiredOpen = computeInjectionPeriod(70, 69, 80, new Date("2026-07-01T00:00:00Z"), now);
assert.ok(expiredOpen, "abgelaufene Frist mit offener Luecke liefert Metriken");
assert.equal(expiredOpen.periodActive, false, "Frist ist abgelaufen");
assert.equal(expiredOpen.gapToTarget, 10, "offene Luecke bleibt sichtbar");
assert.equal(expiredOpen.requiredDailyRate, 0, "abgelaufene Frist liefert keine Infinity-Rate");
assert.equal(Number.isFinite(expiredOpen.requiredDailyRate), true, "requiredDailyRate bleibt endlich");
assert.equal(expiredOpen.onTrack, false, "offene Luecke nach Frist ist nicht auf Kurs");

console.log("indicator-zones.test.ts: PASS");
