import assert from "node:assert/strict";
import { getPasskeyRelyingParty } from "./passkey-rp";

assert.deepEqual(getPasskeyRelyingParty("https://wachsam.ruhrlogik.de"), {
  id: "wachsam.ruhrlogik.de",
  name: "WachSam",
  origin: "https://wachsam.ruhrlogik.de",
});

assert.deepEqual(getPasskeyRelyingParty("http://127.0.0.1:3100"), {
  id: "127.0.0.1",
  name: "WachSam",
  origin: "http://127.0.0.1:3100",
});

assert.throws(() => getPasskeyRelyingParty("http://example.test"), /HTTPS-Origin/);
assert.throws(() => getPasskeyRelyingParty(undefined), /AUTH_URL/);

console.log("passkey-rp.test.ts: alle Assertions gruen");
