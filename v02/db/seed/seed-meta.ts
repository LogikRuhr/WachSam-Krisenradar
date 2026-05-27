import type { InferInsertModel } from "drizzle-orm";
import { seedMeta } from "../schema";
import { SEED_META as sourceSeedMeta } from "./source-data/seed-meta";

export type NewSeedMeta = InferInsertModel<typeof seedMeta>;

export const SEED_META: NewSeedMeta[] = Object.entries(sourceSeedMeta).map(([key, value]) => ({
  key,
  value,
}));
