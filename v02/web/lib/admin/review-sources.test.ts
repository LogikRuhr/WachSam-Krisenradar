import assert from "node:assert/strict";
import { parseNationalStateReviewSources } from "./review-sources";

assert.deepEqual(
  parseNationalStateReviewSources([
    { sourceName: "Destatis", sourceUrl: "https://www.destatis.de/", sourceStand: "18. Juli 2026" },
    { sourceName: "", sourceUrl: "https://invalid.example/", sourceStand: "18. Juli 2026" },
  ]),
  [{ sourceName: "Destatis", sourceUrl: "https://www.destatis.de/", sourceStand: "18. Juli 2026" }],
  "Nur vollständige Gesamtstand-Quellen erscheinen in der Review.",
);

assert.deepEqual(parseNationalStateReviewSources(null), [], "Fehlende Quellen bleiben leer statt erfunden.");
