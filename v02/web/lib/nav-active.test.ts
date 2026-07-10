import assert from "node:assert/strict";
import { isActivePath } from "./nav-active";

// --- Home: nur exakte Übereinstimmung ------------------------------------------

assert.equal(isActivePath("/", "/"), true, "/ ↔ / aktiv");
assert.equal(isActivePath("/lage", "/"), false, "/lage ↔ / inaktiv (Home nur exakt)");

// --- Segment-Präfix für alle anderen Ziele -------------------------------------

assert.equal(isActivePath("/kaskaden/abc", "/kaskaden"), true, "/kaskaden/abc ↔ /kaskaden aktiv (Unterseite)");
assert.equal(isActivePath("/lage", "/lage"), true, "/lage ↔ /lage aktiv (exakt)");

// --- Präfix-Falle: /kostenlos darf /kosten NICHT matchen ------------------------

assert.equal(isActivePath("/kostenlos", "/kosten"), false, "/kostenlos ↔ /kosten inaktiv (keine Wort-Teilübereinstimmung)");

console.log("nav-active.test.ts: PASS");
