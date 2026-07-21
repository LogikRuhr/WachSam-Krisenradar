import assert from "node:assert/strict";
import { hasRequiredReviewConfirmation } from "./review-confirmation";

assert.equal(hasRequiredReviewConfirmation("nationalState", null), false, "Gesamtstand darf nicht ohne Server-Bestätigung publizieren.");
assert.equal(hasRequiredReviewConfirmation("nationalState", "on"), true, "Bestätigter Gesamtstand darf den Workflow fortsetzen.");
assert.equal(hasRequiredReviewConfirmation("facts", null), true, "Andere Editorial-Items behalten ihren bestehenden Workflow.");
