import { createHash } from "node:crypto";
import type { InferInsertModel } from "drizzle-orm";
import { sources } from "../schema";
import { ITEM_SOURCES } from "./item-sources";

export type NewSource = InferInsertModel<typeof sources>;

const byUrl = new Map<string, NewSource>();

for (const source of ITEM_SOURCES) {
  if (!byUrl.has(source.sourceUrl)) {
    const stableId = createHash("sha256").update(source.sourceUrl).digest("hex").slice(0, 12);
    byUrl.set(source.sourceUrl, {
      id: `source-${stableId}`,
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      sourceStand: source.sourceStand,
    });
  }
}

export const SOURCES: NewSource[] = Array.from(byUrl.values()).sort((a, b) => a.sourceUrl.localeCompare(b.sourceUrl));
