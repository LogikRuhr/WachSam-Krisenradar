import assert from "node:assert/strict";
import { createRateLimiter } from "./rate-limit";

const rl = createRateLimiter({ max: 2, windowMs: 1000 });

assert.equal(rl.check("ip1", 0).allowed, true, "1. Anfrage erlaubt");
assert.equal(rl.check("ip1", 100).allowed, true, "2. Anfrage erlaubt");
assert.equal(rl.check("ip1", 200).allowed, false, "3. Anfrage im Fenster → blockiert");
assert.equal(rl.check("ip2", 200).allowed, true, "andere Quelle (key) unabhängig");
assert.equal(rl.check("ip1", 1300).allowed, true, "nach Ablauf des Fensters wieder erlaubt");

const remaining = createRateLimiter({ max: 3, windowMs: 1000 });
assert.equal(remaining.check("a", 0).remaining, 2, "remaining zählt herunter");
assert.equal(remaining.check("a", 1).remaining, 1);
assert.equal(remaining.check("a", 2).remaining, 0);
assert.equal(remaining.check("a", 3).allowed, false, "über max → blockiert");

console.log("rate-limit.test.ts: PASS");
