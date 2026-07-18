// Reine Sortier- und Pinning-Logik für die redaktionelle Review-Queue — keine
// DB-, keine Permissions-Abhängigkeit. Bestimmt Status-Priorität, Sortierreihenfolge
// und die Deckel-Ausnahme für fest angepinnte Item-Typen (z.B. Gesamtstand
// Deutschland), damit sie unabhängig vom Alter immer sichtbar bleiben.

type ReviewStatus = "draft" | "approved" | "rejected" | "published";

export const statusPriority: Record<ReviewStatus, number> = {
  draft: 0,
  approved: 1,
  rejected: 2,
  published: 3,
};

export function latestReviewTime(row: {
  editorialReviewedAt: Date | null;
  publishedAt: Date | null;
  createdAt?: Date | null;
}) {
  return (row.editorialReviewedAt ?? row.publishedAt ?? row.createdAt)?.getTime() ?? 0;
}

export function sortForReview<
  T extends {
    status: ReviewStatus;
    editorialReviewedAt: Date | null;
    publishedAt: Date | null;
    createdAt?: Date | null;
    id: string;
  },
>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      statusPriority[a.status] - statusPriority[b.status] ||
      latestReviewTime(b) - latestReviewTime(a) ||
      a.id.localeCompare(b.id),
  );
}

/** Item-Typen, die den Review-Deckel umgehen — bleiben unabhängig von Alter/Deckel sichtbar. */
export const PINNED_REVIEW_TYPES: ReadonlySet<string> = new Set(["nationalState"]);

/**
 * Baut die Review-Queue aus gepinnten und übrigen Items. Gepinnte Typen (z.B. der
 * Gesamtstand Deutschland) stehen immer vollständig voran, jeweils sortiert mit
 * `sortForReview`; der numerische Deckel (`limit`) gilt ausschließlich für die
 * übrigen Items. Das Ergebnis kann `limit` daher überschreiten.
 */
export function buildReviewQueue<
  T extends {
    type: string;
    status: ReviewStatus;
    editorialReviewedAt: Date | null;
    publishedAt: Date | null;
    createdAt?: Date | null;
    id: string;
  },
>(rows: T[], limit: number, pinnedTypes: ReadonlySet<string> = PINNED_REVIEW_TYPES): T[] {
  const pinned = rows.filter((row) => pinnedTypes.has(row.type));
  const rest = rows.filter((row) => !pinnedTypes.has(row.type));
  return [...sortForReview(pinned), ...sortForReview(rest).slice(0, limit)];
}
