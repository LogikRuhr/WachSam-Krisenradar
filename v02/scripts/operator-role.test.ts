import assert from "node:assert/strict";
import {
  buildRoleChangeSummary,
  maskEmail,
  parseOperatorRoleCommand,
} from "./operator-role";

assert.equal(maskEmail("jean@example.com"), "j***@example.com");
assert.equal(maskEmail("ab@example.com"), "a***@example.com");

assert.deepEqual(
  parseOperatorRoleCommand(["--email", "JEAN@EXAMPLE.COM", "--role", "editor", "--confirm"]),
  { email: "jean@example.com", role: "editor", confirm: true },
);

assert.deepEqual(
  parseOperatorRoleCommand(["--email", "jean@example.com", "--role", "viewer"]),
  { email: "jean@example.com", role: "viewer", confirm: false },
);

assert.throws(() => parseOperatorRoleCommand(["--email", "jean@example.com", "--role", "owner"]), /role/);
assert.throws(() => parseOperatorRoleCommand(["--role", "editor"]), /email/);
assert.throws(() => parseOperatorRoleCommand(["--email", "not-an-email", "--role", "editor"]), /email/);

assert.equal(
  buildRoleChangeSummary({ email: "jean@example.com", currentRole: "viewer", nextRole: "editor", confirmed: false }),
  "[DRY-RUN] j***@example.com: viewer -> editor",
);
assert.equal(
  buildRoleChangeSummary({ email: "jean@example.com", currentRole: "editor", nextRole: "admin", confirmed: true }),
  "UPDATED j***@example.com: editor -> admin",
);

console.log("operator-role.test.ts: PASS");
