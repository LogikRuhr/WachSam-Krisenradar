import { existsSync, readFileSync } from "node:fs";
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

function assertFileMissing(file: string, reason: string) {
  assert.equal(existsSync(join(root, file)), false, `${file}: ${reason}`);
}

const authConfig = read("web/auth.config.ts");
const authRuntime = read("web/lib/auth.ts");
const adminEditorial = read("web/lib/admin/editorial.ts");
const adminPermissions = read("web/lib/admin/permissions.ts");
const publicData = read("web/lib/public-data.ts");

assertFileMissing("web/middleware.ts", "database-session auth must be enforced by node server checks, not edge cookie gates");
assertIncludes("web/app/profil/page.tsx", 'redirect("/login")', "profile route must stay protected after W1.5");
assertIncludes("web/app/admin/layout.tsx", "requireEditorRole", "admin routes must be protected for W1.6a+");
assertIncludes("web/app/admin/layout.tsx", 'dynamic = "force-dynamic"', "admin routes must not prerender auth redirects");
assertIncludes("web/app/review/layout.tsx", "requireEditorRole", "review routes must be protected for W1.6a+");
assertIncludes("web/app/review/layout.tsx", 'dynamic = "force-dynamic"', "review routes must not prerender auth redirects");
assertIncludes("web/lib/admin/permissions.ts", "isAuthRuntimeConfigured", "admin role checks must not call auth() when DB auth runtime is missing");
assertIncludes("web/lib/admin/redirect.ts", 'redirect("/login")', "admin/review page loaders must redirect cleanly on auth failure");
assertIncludes("web/app/admin/page.tsx", "withEditorRedirect", "admin overview must redirect auth failures at page boundary");
assertIncludes("web/app/review/page.tsx", "withEditorRedirect", "review queue must redirect auth failures at page boundary");
assertIncludes("web/auth.config.ts", 'role === "editor" || role === "admin"', "admin gate must require editor/admin role");
assertDoesNotInclude("web/auth.config.ts", "hasSessionCookie", "middleware must not trust raw session-cookie presence");
assertDoesNotInclude("web/auth.config.ts", "sessionCookiePresent", "middleware must not trust raw session-cookie presence");
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
assertIncludes("web/lib/auth-onboarding.ts", 'login: "/profil"', "login magic-link redirect must open the personal area");
assertIncludes("web/lib/auth-onboarding.ts", 'register: "/profil?welcome=1"', "register magic-link redirect must open profile onboarding");
assertIncludes("web/app/login/page.tsx", 'authRedirectForIntent("login")', "login page must use the central login redirect");
assertIncludes("web/app/register/page.tsx", 'authRedirectForIntent("register")', "register page must use the central registration redirect");
assertDoesNotInclude("web/app/login/verify/page.tsx", "Konto gefunden", "verify request page must not confirm account existence");
assertDoesNotInclude("web/app/login/verify/page.tsx", "registriert", "verify request page must not confirm registration state");
assertIncludes("web/app/profil/page.tsx", 'welcome === "1"', "profile page must support first-login onboarding without persistence");

for (const file of [
  "web/lib/feedback.ts",
  "web/app/api/feedback/route.ts",
  "web/components/FeedbackWidget.tsx",
  "web/app/admin/feedback/page.tsx",
]) {
  assertDoesNotInclude(file, "contactEmail", "active feedback web paths must not accept, render, or persist contactEmail");
  assertDoesNotInclude(file, "contact_email", "active feedback web paths must not persist contact_email");
}
assertDoesNotInclude("web/app/admin/feedback/page.tsx", "<th>Kontakt</th>", "feedback admin table must not expose a contact column");
assertDoesNotInclude("web/app/admin/feedback/page.tsx", 'data-label="Kontakt"', "feedback admin rows must not expose a contact cell");
assertDoesNotInclude("web/app/datenschutz/page.tsx", "freiwillige Kontakt-E-Mail", "privacy copy must not describe feedback contact email collection");
assertIncludes("web/app/datenschutz/page.tsx", "keine Kontaktadressen", "privacy copy must state that feedback stores no contact addresses");

assertDoesNotInclude("web/app/profil/profile-form.tsx", 'name="plz"', "profile form must not collect postal codes");
assertDoesNotInclude("web/components/HouseholdCheck.tsx", "check-plz", "anonymous household check must not ask for postal codes");
assertIncludes("web/lib/profile.ts", "plz: null", "profile writes must clear legacy postal code storage");
assertIncludes("web/app/datenschutz/page.tsx", "keine PLZ", "privacy copy must state that household profile stores no postal code");
assertDoesNotInclude("web/lib/use-user-modus.ts", "plz:", "profile helper must not expose postal codes");
assertDoesNotInclude("web/lib/household-check.ts", "plz:", "household check profile input must not accept postal codes");
assertDoesNotInclude("web/lib/personalization.ts", "plz:", "personalization profile input must not accept postal codes");
assertDoesNotInclude("web/lib/onboarding.ts", "PLZ", "active onboarding copy must not ask for postal codes");

assertIncludes("web/lib/watchlist.ts", "onConflictDoNothing", "watchlist add must be idempotent under duplicate submissions");
assertIncludes("web/lib/watchlist.ts", "eq(userWatchlistItems.userId, userId)", "watchlist delete must stay scoped to current user");

assertIncludes("web/components/RegionSwitcher.tsx", "Regionalisiert nur die DWD-Warnlage", "region selector must explain its limited scope");
assertIncludes("web/app/radar/page.tsx", "ausschließlich die amtliche DWD-Warnlage", "radar page must explain regional filter scope");
assertDoesNotInclude("web/lib/indicator-zones.ts", "Infinity", "injection period must not emit non-finite rates");

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
