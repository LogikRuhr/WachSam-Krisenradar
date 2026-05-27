import type { InferInsertModel } from "drizzle-orm";
import { sources } from "../schema";
import { ITEM_SOURCES } from "./item-sources";

export type NewSource = InferInsertModel<typeof sources>;

const byUrl = new Map<string, NewSource>();

for (const source of ITEM_SOURCES) {
  if (!byUrl.has(source.sourceUrl)) {
    const index = String(byUrl.size + 1).padStart(3, "0");
    byUrl.set(source.sourceUrl, {
      id: `source-${index}`,
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      sourceStand: source.sourceStand,
    });
  }
}

export const SOURCES: NewSource[] = Array.from(byUrl.values()).sort((a, b) => a.sourceUrl.localeCompare(b.sourceUrl));
