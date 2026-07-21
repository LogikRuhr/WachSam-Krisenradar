import assert from "node:assert/strict";
import { nationalStateSchema } from "./schemas";

const base = {
  id: "ns-2026-07",
  standDate: "2026-07-20T00:00:00Z",
  overallTone: "beobachten",
  executiveSummary: "Quellengebundener Gesamtstand zur redaktionellen Prüfung.",
  revisionCriteria: [],
};

const missingSources = nationalStateSchema.safeParse(base);
assert.equal(missingSources.success, false, "Gesamtstand ohne Primärquelle darf nicht gespeichert werden");

const withSource = nationalStateSchema.safeParse({
  ...base,
  sources: [{
    sourceName: "Europäische Zentralbank",
    sourceUrl: "https://www.ecb.europa.eu/",
    sourceStand: "17. Juni 2026",
    isPrimarySource: true,
  }],
});
assert.equal(withSource.success, true, "Gesamtstand mit Primärquelle muss valide sein");

const unsafeUrl = nationalStateSchema.safeParse({
  ...base,
  sources: [{
    sourceName: "Unsafe source",
    sourceUrl: "javascript:alert(1)",
    sourceStand: "20. Juli 2026",
    isPrimarySource: true,
  }],
});
assert.equal(unsafeUrl.success, false, "Gesamtstand darf keine JavaScript-URLs speichern");

const malformedUrl = nationalStateSchema.safeParse({
  ...base,
  sources: [{
    sourceName: "Malformed source",
    sourceUrl: "not a url",
    sourceStand: "20. Juli 2026",
    isPrimarySource: true,
  }],
});
assert.equal(malformedUrl.success, false, "Ungültige URLs müssen als Validierungsfehler zurückkehren, nicht abstürzen");

const nonPrimary = nationalStateSchema.safeParse({
  ...base,
  sources: [{
    sourceName: "Sekundärquelle",
    sourceUrl: "https://example.org/",
    sourceStand: "20. Juli 2026",
    isPrimarySource: false,
  }],
});
assert.equal(nonPrimary.success, false, "Gesamtstand verlangt eine ausdrücklich markierte Primärquelle");

const primaryAndSecondary = nationalStateSchema.safeParse({
  ...base,
  sources: [
    {
      sourceName: "Primärquelle",
      sourceUrl: "https://www.ecb.europa.eu/",
      sourceStand: "17. Juni 2026",
      isPrimarySource: true,
    },
    {
      sourceName: "Sekundärquelle",
      sourceUrl: "https://example.org/",
      sourceStand: "20. Juli 2026",
      isPrimarySource: false,
    },
  ],
});
assert.equal(primaryAndSecondary.success, true, "Gesamtstand darf neben der Primärquelle weitere Quellen führen");
