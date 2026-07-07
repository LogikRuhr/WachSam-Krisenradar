import assert from "node:assert/strict";
import { dedupeSourcesForDisplay, sourceDisplayDedupeKey, type SourceDedupeInput } from "./public-data";

const source = (overrides: Partial<SourceDedupeInput> = {}): SourceDedupeInput => ({
  itemType: "indicator",
  itemId: "wi-diesel",
  sourceName: "ADAC",
  sourceUrl: "https://example.test/source-a",
  sourceStand: "2026-07-07",
  ...overrides,
});

// Sichtgleiche Quellen pro Item werden nur einmal gerendert, auch wenn URLs intern abweichen.
{
  const rows = [
    source({ sourceUrl: "https://example.test/source-a" }),
    source({ sourceUrl: "https://example.test/source-b" }),
  ];
  const deduped = dedupeSourcesForDisplay(rows);
  assert.equal(deduped.length, 1, "same item + visible source identity collapses");
  assert.equal(deduped[0].sourceUrl, "https://example.test/source-a", "first ordered source is preserved");
}

// Unterschiedliche Stände bleiben sichtbar, weil sie redaktionell unterschiedliche Evidenz markieren.
{
  const rows = [
    source({ sourceStand: "2026-07-06" }),
    source({ sourceStand: "2026-07-07" }),
  ];
  assert.equal(dedupeSourcesForDisplay(rows).length, 2, "different stands remain separate");
}

// Gleiche sichtbare Quelle auf unterschiedlichen Items bleibt erhalten.
{
  const rows = [
    source({ itemId: "wi-diesel" }),
    source({ itemId: "wi-e5" }),
  ];
  assert.equal(dedupeSourcesForDisplay(rows).length, 2, "same source on different items remains separate");
}

// Ohne Stand nutzt der Key die URL als Fallback, damit verschiedene Quellen nicht verschmelzen.
{
  const rows = [
    source({ sourceStand: "", sourceUrl: "https://example.test/source-a" }),
    source({ sourceStand: "", sourceUrl: "https://example.test/source-b" }),
  ];
  assert.equal(dedupeSourcesForDisplay(rows).length, 2, "blank stand falls back to URL");
}

assert.equal(
  sourceDisplayDedupeKey(source({ sourceName: " ADAC ", sourceStand: " 2026-07-07 " })),
  "indicator:wi-diesel:ADAC:2026-07-07",
  "source key trims visible labels",
);

console.log("public-data.test.ts ok");
