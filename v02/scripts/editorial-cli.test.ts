import assert from "node:assert/strict";
import {
  allowedTransition,
  defaultReportPath,
  formatQueue,
  formatReport,
  parseCommand,
  parseItemType,
  sanitizeOutput,
  type QueueItem,
} from "./editorial-cli";

const sampleItems: QueueItem[] = [
  {
    type: "lagebildItems",
    label: "Lagebild",
    id: "draft-1",
    title: "Neue Lagekarte name@example.com",
    status: "draft",
    queuedAt: new Date("2026-06-30T10:00:00Z"),
  },
  {
    type: "costImpacts",
    label: "Kostenwirkungen",
    id: "approved-1",
    title: "Kostenwirkung Energie",
    status: "approved",
    queuedAt: new Date("2026-06-30T09:00:00Z"),
  },
];

assert.equal(parseItemType("lagebild"), "lagebildItems");
assert.equal(parseItemType("cost_impacts"), "costImpacts");
assert.throws(() => parseItemType("unknown"), /Unbekannter Typ/);

assert.deepEqual(parseCommand(["queue", "--limit", "5", "--json"]), { command: "queue", limit: 5, json: true });
assert.deepEqual(parseCommand(["approve", "lagebild", "abc", "--dry-run"]), {
  command: "approve",
  itemType: "lagebildItems",
  id: "abc",
  reason: undefined,
  dryRun: true,
});
assert.deepEqual(parseCommand(["reject", "cost_impacts", "abc", "--reason", "Quelle unklar"]), {
  command: "reject",
  itemType: "costImpacts",
  id: "abc",
  reason: "Quelle unklar",
  dryRun: false,
});
assert.throws(() => parseCommand(["reject", "cost_impacts", "abc"]), /--reason/);
assert.throws(() => parseCommand(["queue", "--limit", "0"]), /--limit/);

assert.equal(allowedTransition("approve", "draft"), "approved");
assert.equal(allowedTransition("publish", "approved"), "published");
assert.equal(allowedTransition("reject", "approved"), "rejected");
assert.throws(() => allowedTransition("publish", "draft"), /nur aus approved/);

assert.equal(sanitizeOutput("Kontakt test@example.org im Titel"), "Kontakt [redacted-email] im Titel");
assert.match(defaultReportPath(new Date("2026-06-30T10:11:12.000Z")), /outputs[\\/]+editorial-review-2026-06-30T10-11-12-000Z\.md/);

const queue = formatQueue(sampleItems);
assert.match(queue, /\[draft\] lagebildItems\/draft-1/);
assert.match(queue, /next: editorial:approve lagebildItems draft-1/);
assert.doesNotMatch(queue, /name@example.com/);
assert.match(queue, /\[redacted-email\]/);

const report = formatReport(sampleItems, new Date("2026-06-30T11:00:00Z"));
assert.match(report, /# WachSam Editorial Review/);
assert.match(report, /Drafts: 1/);
assert.match(report, /Freigegeben, noch nicht publiziert: 1/);
assert.match(report, /pnpm editorial:publish costImpacts approved-1/);
assert.doesNotMatch(report, /name@example.com/);

console.log("editorial-cli.test.ts: PASS");
