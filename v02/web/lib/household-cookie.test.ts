import assert from "node:assert/strict";
import {
  HOUSEHOLD_COOKIE,
  HOUSEHOLD_COOKIE_MAX_AGE_SECONDS,
  parseHousehold,
  serializeHousehold,
} from "./household-cookie";

// --- Cookie-Name und Max-Age -----------------------------------------------------

assert.equal(HOUSEHOLD_COOKIE, "ws-household", "Cookie-Name ws-household");
assert.equal(HOUSEHOLD_COOKIE_MAX_AGE_SECONDS, 60 * 60 * 24 * 365, "Max-Age 1 Jahr");

// --- serializeHousehold: nur die zwei Enum-Werte, keine PII ----------------------

assert.equal(serializeHousehold("familie", "gas"), "familie|gas", "modus|heizart Format");
assert.equal(serializeHousehold("single", "unbekannt"), "single|unbekannt");

// --- Round-Trip: parse(serialize(...)) ergibt dieselben Werte für jede Kombination

const MODUS_VALUES = ["single", "familie", "selbststaendig", "rentner"] as const;
const HEIZART_VALUES = ["gas", "oel", "fernwaerme", "waermepumpe", "strom", "unbekannt"] as const;

for (const modus of MODUS_VALUES) {
  for (const heizart of HEIZART_VALUES) {
    const roundTripped = parseHousehold(serializeHousehold(modus, heizart));
    assert.deepEqual(roundTripped, { modus, heizart }, `Round-Trip für ${modus}|${heizart}`);
  }
}

// --- parseHousehold: ungültige/unbekannte Teile → null, nie ein Crash -----------

assert.deepEqual(
  parseHousehold("nicht-existent|gas"),
  { modus: null, heizart: "gas" },
  "ungültiger Modus → null, gültige Heizart bleibt erhalten",
);

assert.deepEqual(
  parseHousehold("familie|kohle"),
  { modus: "familie", heizart: null },
  "ungültige Heizart → null, gültiger Modus bleibt erhalten",
);

assert.deepEqual(
  parseHousehold("unsinn|quatsch"),
  { modus: null, heizart: null },
  "beide Teile ungültig → beide null",
);

assert.deepEqual(
  parseHousehold("familie"),
  { modus: "familie", heizart: null },
  "fehlender Heizart-Teil (kein Trennzeichen) → heizart null",
);

// --- parseHousehold: leerer/null/undefined Input → null-Felder, kein Crash ------

assert.deepEqual(parseHousehold(null), { modus: null, heizart: null }, "null → null-Felder");
assert.deepEqual(parseHousehold(undefined), { modus: null, heizart: null }, "undefined → null-Felder");
assert.deepEqual(parseHousehold(""), { modus: null, heizart: null }, "leerer String → null-Felder");

// --- garantiert nur Enum-Werte: kein Wert außerhalb der bekannten Listen --------

for (const modus of MODUS_VALUES) {
  for (const heizart of HEIZART_VALUES) {
    const result = parseHousehold(serializeHousehold(modus, heizart));
    if (result.modus !== null) assert.ok((MODUS_VALUES as readonly string[]).includes(result.modus), "modus ist Enum-Wert");
    if (result.heizart !== null) assert.ok((HEIZART_VALUES as readonly string[]).includes(result.heizart), "heizart ist Enum-Wert");
  }
}

console.log("household-cookie.test.ts ok");
