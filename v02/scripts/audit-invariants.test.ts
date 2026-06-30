import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { FACTS } from "../db/seed/facts";
import { seedData } from "../db/seed";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(root, path), "utf8");

function assertDoesNotInclude(file: string, forbidden: string, reason: string) {
  const content = read(file);
  assert.equal(content.includes(forbidden), false, `${file}: ${reason}`);
}

function assertIncludes(file: string, expected: string, reason: string) {
  const content = read(file);
  assert.equal(content.includes(expected), true, `${file}: ${reason}`);
}

const middleware = read("web/middleware.ts");
const authConfig = read("web/auth.config.ts");
const authRuntime = read("web/lib/auth.ts");
const adminEditorial = read("web/lib/admin/editorial.ts");
const adminPermissions = read("web/lib/admin/permissions.ts");
const publicData = read("web/lib/public-data.ts");

assert.equal(middleware.includes("matcher: []"), false, "middleware must not be disabled with an empty matcher");
assertIncludes("web/middleware.ts", "NextAuth(authConfig)", "protected routes must use the shared edge-safe auth config");
assertIncludes("web/auth.config.ts", 'path.startsWith("/profil")', "profile route must stay protected after W1.5");
assertIncludes("web/auth.config.ts", 'path.startsWith("/admin")', "admin routes must be protected for W1.6a+");
assertIncludes("web/auth.config.ts", 'role === "editor" || role === "admin"', "admin gate must require editor/admin role");
const adminAuthBlock = authConfig.slice(authConfig.indexOf('path.startsWith("/admin")'));
assert.equal(adminAuthBlock.includes("hasSessionCookie"), false, "admin routes must not rely on session-cookie presence only");
assert.equal(authConfig.includes("@wachsam/db"), false, "edge auth config must not import database schema");
assert.equal(authConfig.includes("./lib/db"), false, "edge auth config must not import database client");
assertIncludes("web/lib/auth.ts", "sessionUser.role", "node auth runtime must expose user role to the session");
assertIncludes("web/lib/auth.ts", "sessionUser.id", "node auth runtime must expose user id to the session");
assertIncludes("web/lib/admin/permissions.ts", 'row.role !== "editor" && row.role !== "admin"', "admin server actions must require editor/admin role");

for (const actionName of ["createDraft", "updateDraft", "approveItem", "rejectItem", "publishItem", "unpublishItem"]) {
  assertIncludes("web/lib/admin/editorial.ts", `export async function ${actionName}`, `admin action ${actionName} must exist`);
}
assert.equal((adminEditorial.match(/requireEditorRole\(\)/g) ?? []).length >= 3, true, "admin mutations must call requireEditorRole before DB writes");
assertIncludes("web/lib/admin/editorial.ts", "logAuditEvent", "admin mutations must write audit log events");
assertIncludes("web/lib/admin/permissions.ts", "auth()", "admin role checks must bind to the current session");
assertIncludes("web/lib/admin/audit-log.ts", "editorialAuditLog", "audit events must persist to editorial_audit_log");
assert.equal(adminPermissions.includes("hasSessionCookie"), false, "server-side admin role checks must not trust raw cookies");

for (const tableName of [
  "lagebildItems",
  "costImpacts",
  "supplyRisks",
  "cascades",
  "governance",
  "indicators",
  "citizenActions",
]) {
  assertIncludes("web/lib/public-data.ts", `schema.${tableName}.editorialStatus`, `public query for ${tableName} must filter editorial status`);
}
assertIncludes("web/lib/public-data.ts", 'const PUBLISHED = "published" as const', "public data filter must use published status consistently");
assert.equal(publicData.includes('editorialStatus, "draft"'), false, "draft items must not be queried for public UI");

assertDoesNotInclude("web/app/login/page.tsx", "Welle W1.4", "internal wave labels must not be visible in citizen UI");
assertDoesNotInclude("web/app/register/page.tsx", "Welle W1.4", "internal wave labels must not be visible in citizen UI");
assertDoesNotInclude("web/components/TopNav.tsx", "title={email}", "full email must not be exposed in DOM title attributes");
assertDoesNotInclude("web/lib/auth.ts", "build-placeholder-resend-key", "auth runtime must not use placeholder provider secrets");
assertIncludes("web/app/login/page.tsx", "assertAuthRuntimeReady", "login action must fail explicitly when auth runtime env is missing");
assertIncludes("web/app/register/page.tsx", "assertAuthRuntimeReady", "register action must fail explicitly when auth runtime env is missing");

assertIncludes("db/package.json", "\"generate\": \"drizzle-kit generate\"", "db generate script must be Windows-compatible");
assertIncludes("web/package.json", "eslint .", "lint must be non-interactive and not use deprecated next lint");

const iwInflation = FACTS.find((fact) => fact.id === "fact-iw-inflation-2026");
assert.ok(iwInflation, "IW inflation fact must exist");
assert.equal(iwInflation.valueNumeric, "2", "IW inflation fact must match the cited IW source");
assert.equal(iwInflation.sourceStand, "5. Dezember 2025", "IW inflation source date must match cited IW publication");

const destatisFuel = FACTS.find((fact) => fact.id === "fact-destatis-kraftstoffe-2026-04");
assert.ok(destatisFuel, "Destatis fuel fact must exist");
assert.equal(destatisFuel.valueNumeric, "26.2", "Destatis fuel fact must use the concrete April 2026 fuel value");

const expectedFuelIndicators = [
  {
    id: "wi-kraftstoffpreis-super-e5",
    baselineValue: null,
    crisisReferenceValue: null,
    thresholdWarn: null,
    thresholdCritical: null,
  },
  {
    id: "wi-kraftstoffpreis-super-e10",
    baselineValue: "1.405",
    crisisReferenceValue: "1.86",
    thresholdWarn: "1.63",
    thresholdCritical: "1.86",
  },
  {
    id: "wi-kraftstoffpreis-diesel",
    baselineValue: "1.262",
    crisisReferenceValue: "1.946",
    thresholdWarn: "1.6",
    thresholdCritical: "1.95",
  },
];

for (const expected of expectedFuelIndicators) {
  const indicator = seedData.indicators.find((item) => item.id === expected.id);
  assert.ok(indicator, `${expected.id} must exist`);
  assert.equal(indicator.baselineValue, expected.baselineValue, `${expected.id} baseline must match calibration state`);
  assert.equal(indicator.crisisReferenceValue, expected.crisisReferenceValue, `${expected.id} crisis reference must match calibration state`);
  assert.equal(indicator.thresholdWarn, expected.thresholdWarn, `${expected.id} warn threshold must match calibration state`);
  assert.equal(indicator.thresholdCritical, expected.thresholdCritical, `${expected.id} critical threshold must match calibration state`);
  if (expected.id === "wi-kraftstoffpreis-super-e5") {
    assert.match(indicator.thresholdMethod ?? "", /keine WachSam-Schwellenzone/i, "Super E5 must not invent ADAC thresholds");
  } else {
    assert.equal(indicator.baselinePeriod, "2019", `${expected.id} baseline period must be explicit`);
    assert.equal(indicator.crisisReferencePeriod, "2022", `${expected.id} crisis period must be explicit`);
    assert.match(indicator.thresholdMethod ?? "", /baseline \+ 50%/, `${expected.id} must document threshold derivation`);
  }
}

const householdEnergyPrices = [
  { id: "wi-strompreis-haushalt", value: "37", unit: "ct/kWh" },
  { id: "wi-gaspreis-haushalt-efh", value: "11.1", unit: "ct/kWh" },
];
for (const expected of householdEnergyPrices) {
  const indicator = seedData.indicators.find((item) => item.id === expected.id);
  assert.ok(indicator, `${expected.id} must exist`);
  assert.equal(indicator.currentValue, expected.value, `${expected.id} must carry the BDEW editorial price stand`);
  assert.equal(indicator.unit, expected.unit, `${expected.id} must use household energy units`);
  assert.equal(indicator.thresholdWarn, null, `${expected.id} must not invent a WachSam threshold`);
  assert.match(indicator.thresholdMethod ?? "", /redaktioneller Preisstand/i, `${expected.id} must document editorial-only status`);
}

const factRefs = (seedData as typeof seedData & { factRefs?: Array<{ factId: string }> }).factRefs ?? [];
const referencedFactIds = new Set(factRefs.map((ref) => ref.factId));
for (const fact of FACTS) {
  assert.equal(referencedFactIds.has(fact.id), true, `fact ${fact.id} must be referenced through factRefs`);
}

const sourceRows = (seedData as typeof seedData & { sources?: Array<{ sourceUrl: string }> }).sources ?? [];
const uniqueSourceUrls = new Set(sourceRows.map((source) => source.sourceUrl));
assert.equal(sourceRows.length, uniqueSourceUrls.size, "normalized source catalog must contain each URL once");
assert.equal(sourceRows.length < seedData.itemSources.length, true, "source catalog must deduplicate item source references");
for (const source of sourceRows) {
  const stableId = `source-${createHash("sha256").update(source.sourceUrl).digest("hex").slice(0, 12)}`;
  assert.equal(source.id, stableId, `source ${source.sourceUrl} must use a stable URL-derived id`);
}

console.log("audit invariants ok");
