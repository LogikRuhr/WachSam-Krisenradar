import assert from "node:assert/strict";
import { computeThemeState, computeWarnlageState, THEME_CHANNELS } from "./themes";

const mk = (id: string, zone: "uncritical" | "elevated" | "critical" | "pending") =>
  ({ id, zone, label: id });

// --- Korroborationsregel: Stufen aus Indikator-Zonen ableiten ------------------

// 0 auffällige → normal
assert.equal(computeThemeState([mk("a", "uncritical"), mk("b", "uncritical")]).state, "normal", "0 auffällige → normal");
// genau 1 elevated → beobachten (Korroboration fehlt)
assert.equal(computeThemeState([mk("a", "elevated"), mk("b", "uncritical")]).state, "beobachten", "1 elevated → beobachten");
// genau 1 critical → beobachten reicht NICHT: einzelnes critical → erhoeht
assert.equal(computeThemeState([mk("a", "critical"), mk("b", "uncritical")]).state, "erhoeht", "1 critical → erhoeht");
// ≥2 elevated → erhoeht
assert.equal(computeThemeState([mk("a", "elevated"), mk("b", "elevated")]).state, "erhoeht", "2 elevated → erhoeht");
// ≥1 critical + ≥1 weiteres auffälliges → hoch
assert.equal(computeThemeState([mk("a", "critical"), mk("b", "elevated")]).state, "hoch", "critical + elevated → hoch");
// pending zählt nicht als auffällig
assert.equal(computeThemeState([mk("a", "pending"), mk("b", "pending")]).state, "normal", "pending → normal");
// leere Liste → normal mit erklärendem reason
assert.equal(computeThemeState([]).state, "normal", "leere Liste → normal");
// drivers enthält nur auffällige Indikatoren
assert.deepEqual(
  computeThemeState([mk("a", "critical"), mk("b", "uncritical")]).drivers.map((d) => d.id),
  ["a"],
  "drivers enthält nur auffällige Indikatoren",
);

// --- Amtliche Warnlage: DWD max_level Passthrough ------------------------------

assert.equal(computeWarnlageState(0), "normal", "max_level 0 → normal");
assert.equal(computeWarnlageState(2), "beobachten", "max_level 2 → beobachten");
assert.equal(computeWarnlageState(3), "erhoeht", "max_level 3 → erhoeht");
assert.equal(computeWarnlageState(5), "hoch", "max_level 5 → hoch");

// --- Kanal-Konfiguration: jeder Kanal referenziert ≥1 Indikator + alle 4 leadTexts

for (const ch of THEME_CHANNELS) {
  assert.ok(ch.indicatorIds.length >= 1, ch.key);
  for (const s of ["normal", "beobachten", "erhoeht", "hoch"] as const) assert.ok(ch.leadText[s]);
}

console.log("themes.test.ts ok");
