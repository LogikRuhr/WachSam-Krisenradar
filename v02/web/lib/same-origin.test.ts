import assert from "node:assert/strict";
import { isSameOrigin, resolveExpectedHost } from "./same-origin";

// --- resolveExpectedHost: Proxy-Header schlägt request.url -----------------------

// Der eigentliche Bug: hinter Traefik zeigt request.url den INTERNEN Host; der
// vom Proxy gesetzte x-forwarded-host trägt den öffentlichen Host.
assert.equal(
  resolveExpectedHost({
    forwardedHost: "wachsam.ruhrlogik.de",
    host: "web:3000",
    fallbackUrl: "http://web:3000/api/feedback",
  }),
  "wachsam.ruhrlogik.de",
  "x-forwarded-host gewinnt vor host und request.url",
);

assert.equal(
  resolveExpectedHost({ forwardedHost: "a.de, b.de", host: null, fallbackUrl: "http://x/y" }),
  "a.de",
  "erster Eintrag einer x-forwarded-host-Liste",
);

assert.equal(
  resolveExpectedHost({ forwardedHost: null, host: "example.com", fallbackUrl: "http://internal/y" }),
  "example.com",
  "ohne forwarded-host → host-Header",
);

assert.equal(
  resolveExpectedHost({ forwardedHost: null, host: null, fallbackUrl: "https://z.de/pfad" }),
  "z.de",
  "letzter Fallback: Host aus request.url",
);

assert.equal(
  resolveExpectedHost({ forwardedHost: null, host: null, fallbackUrl: "kein-url" }),
  null,
  "unparsebare URL → null",
);

assert.equal(
  resolveExpectedHost({ forwardedHost: "  ", host: " example.com ", fallbackUrl: "http://x/y" }),
  "example.com",
  "leerer forwarded-host → host (getrimmt)",
);

// --- isSameOrigin ---------------------------------------------------------------

assert.equal(isSameOrigin(null, "wachsam.ruhrlogik.de"), true, "kein Origin → erlaubt (same-origin Navigation)");
assert.equal(
  isSameOrigin("https://wachsam.ruhrlogik.de", "wachsam.ruhrlogik.de"),
  true,
  "passender Origin → erlaubt (Prod-Fall, vorher 403)",
);
assert.equal(isSameOrigin("https://evil.example", "wachsam.ruhrlogik.de"), false, "fremder Origin → blockiert");
assert.equal(isSameOrigin("kein-url", "wachsam.ruhrlogik.de"), false, "unparsebarer Origin → blockiert");
assert.equal(isSameOrigin("https://x.de", null), false, "kein bekannter Host → blockiert");

console.log("same-origin.test.ts: PASS");
