import assert from "node:assert/strict";
import { buildSparkline } from "./sparkline";

// --- Leerzustände: Sparkline rendert erst ab zwei endlichen Werten -------------

assert.equal(buildSparkline([]), null, "leere Reihe → null");
assert.equal(buildSparkline([42]), null, "ein Wert → null (kein Trend zeichenbar)");
assert.equal(buildSparkline([Number.NaN, 5]), null, "nur ein endlicher Wert → null");
assert.equal(buildSparkline([Number.NaN, Number.POSITIVE_INFINITY]), null, "kein endlicher Wert → null");

// --- Grundfall: steigende Reihe, Default-Geometrie 100×32, padding 2 -----------

const g = buildSparkline([10, 20, 30]);
assert.ok(g, "drei Werte → Geometrie");
assert.equal(g!.points.length, 3, "drei Punkte");
assert.deepEqual(g!.points[0], { x: 2, y: 30 }, "kleinster Wert → unten links");
assert.deepEqual(g!.points[1], { x: 50, y: 16 }, "mittlerer Wert → Mitte");
assert.deepEqual(g!.points[2], { x: 98, y: 2 }, "größter Wert → oben rechts");
assert.deepEqual(g!.lastPoint, { x: 98, y: 2 }, "lastPoint = jüngster Punkt (für Marker)");
assert.equal(g!.min, 10, "min");
assert.equal(g!.max, 30, "max");
assert.equal(g!.linePath, "M 2 30 L 50 16 L 98 2", "Linien-Pfad");
assert.equal(g!.areaPath, "M 2 30 L 50 16 L 98 2 L 98 30 L 2 30 Z", "Flächen-Pfad schließt zur Basislinie");

// --- Flache Reihe: gleiche Werte → Mittellinie, kein Division-durch-0 -----------

const flat = buildSparkline([5, 5, 5]);
assert.ok(flat, "flache Reihe → Geometrie");
assert.ok(flat!.points.every((p) => p.y === 16), "alle Punkte auf Mittellinie (height/2)");
assert.equal(flat!.linePath, "M 2 16 L 50 16 L 98 16", "flacher Linien-Pfad");

// --- Konfigurierbare Geometrie -------------------------------------------------

const small = buildSparkline([0, 1], { width: 10, height: 10, padding: 1 });
assert.ok(small, "zwei Werte + Optionen → Geometrie");
assert.deepEqual(small!.points, [{ x: 1, y: 9 }, { x: 9, y: 1 }], "Optionen steuern Breite/Höhe/Padding");
assert.equal(small!.linePath, "M 1 9 L 9 1", "kleiner Pfad");

// --- Nicht-endliche Werte werden gefiltert, Reihenfolge bleibt erhalten --------

const filtered = buildSparkline([10, Number.NaN, 30]);
assert.ok(filtered, "ein NaN dazwischen → bleibt zeichenbar (zwei endliche Werte)");
assert.equal(filtered!.points.length, 2, "NaN herausgefiltert");
assert.deepEqual(filtered!.points, [{ x: 2, y: 30 }, { x: 98, y: 2 }], "verbleibende Werte normal skaliert");

console.log("sparkline.test.ts: PASS");
