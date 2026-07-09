import assert from "node:assert/strict";
import { BUNDESLAENDER, REGION_COOKIE, regionName } from "./regions";

// --- Struktur: 16 Bundesländer, eindeutige Codes --------------------------------

assert.equal(BUNDESLAENDER.length, 16, "16 Bundesländer");

const codes = BUNDESLAENDER.map((b) => b.code);
assert.equal(new Set(codes).size, 16, "Codes sind eindeutig");

for (const land of BUNDESLAENDER) {
  assert.ok(land.code.length > 0, `Code vorhanden für ${land.name}`);
  assert.ok(land.name.length > 0, `Name vorhanden für ${land.code}`);
}

// --- Cookie-Name -----------------------------------------------------------------

assert.equal(REGION_COOKIE, "ws-region", "Cookie-Name ws-region");

// --- regionName: ehrlicher Fallback statt Crash bei null/unbekannt ---------------

assert.equal(regionName(null), "Bundesweit", "null → Bundesweit");
assert.equal(regionName(undefined), "Bundesweit", "undefined → Bundesweit");
assert.equal(regionName(""), "Bundesweit", "leerer String → Bundesweit");
assert.equal(regionName("XX"), "Bundesweit", "unbekannter Code → Bundesweit (kein Crash)");

// --- regionName: bislang live verifizierte DWD-Codes (s. Task-5-Report) ---------

assert.equal(regionName("NS"), "Niedersachsen", "live-verifizierter Code NS löst auf");
assert.equal(regionName("MV"), "Mecklenburg-Vorpommern", "live-verifizierter Code MV löst auf");
assert.equal(regionName("SH"), "Schleswig-Holstein", "live-verifizierter Code SH löst auf");
assert.equal(regionName("NRW"), "Nordrhein-Westfalen", "NRW löst auf");
assert.equal(regionName("NW"), "Nordrhein-Westfalen", "DWD-Alias NW wird auf NRW normalisiert");

console.log("regions.test.ts ok");
