export type ReviewSource = {
  sourceName: string;
  sourceUrl: string;
  sourceStand: string;
};

function textValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
}

/** Liest nur vollständige Quellenobjekte aus dem Gesamtstand für die Review. */
export function parseNationalStateReviewSources(value: unknown): ReviewSource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((source) => {
    if (!source || typeof source !== "object") return [];
    const row = source as Record<string, unknown>;
    const sourceName = textValue(row.sourceName);
    const sourceUrl = textValue(row.sourceUrl);
    const sourceStand = textValue(row.sourceStand);
    return sourceName && sourceUrl && sourceStand ? [{ sourceName, sourceUrl, sourceStand }] : [];
  });
}
