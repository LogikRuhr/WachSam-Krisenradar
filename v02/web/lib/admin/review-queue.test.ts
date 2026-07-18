import assert from "node:assert/strict";
import { buildReviewQueue, PINNED_REVIEW_TYPES, sortForReview } from "./review-queue";

type QueueItem = {
  id: string;
  type: string;
  status: "draft" | "approved" | "rejected" | "published";
  editorialReviewedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date | null;
};

function item(overrides: Partial<QueueItem> & { id: string }): QueueItem {
  return {
    type: "lagebildItems",
    status: "draft",
    editorialReviewedAt: null,
    publishedAt: null,
    createdAt: null,
    ...overrides,
  };
}

const day = (n: number) => new Date(2026, 0, n);

// --- sortForReview: Status-Priorität, Zeit desc, id als Tiebreaker ------------

{
  const draftItem = item({ id: "b-draft", status: "draft", createdAt: day(1) });
  const approvedItem = item({ id: "a-approved", status: "approved", createdAt: day(20) });
  const sorted = sortForReview([approvedItem, draftItem]);
  assert.deepEqual(
    sorted.map((row) => row.id),
    ["b-draft", "a-approved"],
    "draft steht vor approved, auch wenn approved jünger ist",
  );
}

{
  const older = item({ id: "older", status: "draft", editorialReviewedAt: day(1) });
  const newer = item({ id: "newer", status: "draft", editorialReviewedAt: day(10) });
  const sorted = sortForReview([older, newer]);
  assert.deepEqual(
    sorted.map((row) => row.id),
    ["newer", "older"],
    "innerhalb gleicher Priorität sortiert die jüngste Zeit zuerst",
  );
}

{
  // Zeit-Fallback: editorialReviewedAt ?? publishedAt ?? createdAt
  const viaPublished = item({ id: "via-published", status: "draft", publishedAt: day(15) });
  const viaCreated = item({ id: "via-created", status: "draft", createdAt: day(5) });
  const sorted = sortForReview([viaCreated, viaPublished]);
  assert.deepEqual(
    sorted.map((row) => row.id),
    ["via-published", "via-created"],
    "Zeit-Fallback greift publishedAt vor createdAt, wenn editorialReviewedAt fehlt",
  );
}

{
  const first = item({ id: "aaa", status: "draft" });
  const second = item({ id: "bbb", status: "draft" });
  const sorted = sortForReview([second, first]);
  assert.deepEqual(
    sorted.map((row) => row.id),
    ["aaa", "bbb"],
    "gleicher Status und gleiche Zeit → id als stabiler Tiebreaker (aufsteigend)",
  );
}

// --- Pinning-Rang: gepinnter Typ steht immer vor fremden Items ----------------

{
  assert.ok(PINNED_REVIEW_TYPES.has("nationalState"), "nationalState ist standardmäßig gepinnt");

  const pinnedApproved = item({ id: "national-approved", type: "nationalState", status: "approved", createdAt: day(1) });
  const foreignDraft = item({ id: "lage-draft", type: "lagebildItems", status: "draft", createdAt: day(20) });

  const queue = buildReviewQueue([foreignDraft, pinnedApproved], 30);
  assert.deepEqual(
    queue.map((row) => row.id),
    ["national-approved", "lage-draft"],
    "approved-nationalState steht vor fremden drafts, obwohl draft normalerweise Priorität hat",
  );
}

// --- Deckel-Kernfall: Pinning überschreitet den Deckel, Rest bleibt gedeckelt -

{
  const youngerDrafts = Array.from({ length: 35 }, (_, index) =>
    item({
      id: `lage-draft-${String(index).padStart(2, "0")}`,
      type: "lagebildItems",
      status: "draft",
      createdAt: day(2), // jünger als der nationalState-Draft
    }),
  );
  const oldestNationalStateDraft = item({
    id: "national-oldest",
    type: "nationalState",
    status: "draft",
    createdAt: day(1), // älter als alle lagebild-Drafts
  });

  const queue = buildReviewQueue([...youngerDrafts, oldestNationalStateDraft], 30);
  assert.equal(queue.length, 31, "Deckel gilt nur für unpinned Items — Ergebnis darf 30 überschreiten");
  assert.equal(queue[0]?.id, "national-oldest", "gepinntes Item steht an Index 0, trotz höherem Alter");
}

// --- Regression: ohne gepinnte Items identisch zu sortForReview + slice -------

{
  const rows = Array.from({ length: 10 }, (_, index) =>
    item({ id: `item-${index}`, type: "lagebildItems", status: index % 2 === 0 ? "draft" : "approved", createdAt: day(index + 1) }),
  );

  const viaBuildReviewQueue = buildReviewQueue(rows, 4, new Set());
  const viaPlainSort = sortForReview(rows).slice(0, 4);
  assert.deepEqual(
    viaBuildReviewQueue.map((row) => row.id),
    viaPlainSort.map((row) => row.id),
    "ohne gepinnte Typen entspricht buildReviewQueue exakt sortForReview + slice",
  );
}

// --- limit=0: nur gepinnte Items -----------------------------------------------

{
  const pinned = item({ id: "national-only", type: "nationalState", status: "draft", createdAt: day(1) });
  const rest = item({ id: "rest-only", type: "lagebildItems", status: "draft", createdAt: day(2) });

  const queue = buildReviewQueue([pinned, rest], 0);
  assert.deepEqual(queue.map((row) => row.id), ["national-only"], "limit=0 liefert ausschließlich gepinnte Items");
}

console.log("review-queue.test.ts: PASS");
