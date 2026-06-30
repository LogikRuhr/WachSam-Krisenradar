import assert from "node:assert/strict";
import {
  editorialStatusLabel,
  editorialStatusExplain,
  editorialActionLabel,
  auditTransitionSummary,
} from "./editorial";

// --- Status-/Action-Labels: deutsch, nie roh/leer ----------------------------

assert.equal(editorialStatusLabel("draft"), "Entwurf");
assert.equal(editorialStatusLabel("published"), "Publiziert");
assert.equal(editorialStatusLabel("sonstig"), "sonstig", "unbekannter Status → Roh-Wert, nie leer");
assert.equal(editorialStatusLabel(null), "—", "null → Strich, kein Crash");

assert.equal(editorialActionLabel("approve"), "Freigegeben");
assert.equal(editorialActionLabel("ingest_value"), "Wert aktualisiert", "Ingestion-Action hat ein Label");
assert.equal(editorialActionLabel("unbekannt"), "unbekannt", "unbekannte Action → Roh-Wert");

// --- Status-Erklärung: erklärt, was der Status praktisch bedeutet -------------

assert.ok(editorialStatusExplain("published").length > 0, "published hat eine Erklärung");
assert.ok(
  editorialStatusExplain("published").toLowerCase().includes("öffentlich"),
  "published-Erklärung nennt die öffentliche Sichtbarkeit",
);
assert.ok(
  editorialStatusExplain("approved").toLowerCase().includes("nicht öffentlich"),
  "approved ist noch nicht öffentlich sichtbar",
);
assert.notEqual(
  editorialStatusExplain("draft"),
  editorialStatusExplain("published"),
  "Stufen erklären sich unterschiedlich",
);
assert.ok(editorialStatusExplain(null).length > 0, "null → generische Erklärung, kein Crash");

// --- auditTransitionSummary: lesbare Ein-Satz-Zusammenfassung -----------------

assert.equal(
  auditTransitionSummary({ action: "approve", fromStatus: "draft", toStatus: "approved" }),
  "Freigegeben: Entwurf → Freigegeben",
  "Übergang mit von/zu wird als Pfeil-Satz formatiert",
);
assert.equal(
  auditTransitionSummary({ action: "create", fromStatus: null, toStatus: "draft" }),
  "Erstellt: → Entwurf",
  "nur zu-Status → ohne von",
);
assert.equal(
  auditTransitionSummary({ action: "update", fromStatus: null, toStatus: null }),
  "Aktualisiert",
  "ohne Status-Übergang → nur die Action",
);

console.log("editorial.test.ts: PASS");
