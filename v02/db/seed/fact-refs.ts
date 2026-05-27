import type { InferInsertModel } from "drizzle-orm";
import { factRefs } from "../schema";
import { LAGEBILD_ITEMS } from "./lagebild";

export type NewFactRef = InferInsertModel<typeof factRefs>;

const lagebildRefs: NewFactRef[] = LAGEBILD_ITEMS.flatMap((item) =>
  item.factIds.map((factId, orderIdx) => ({
    id: `lagebild-${item.id}-${factId}`,
    itemType: "lagebild",
    itemId: item.id,
    factId,
    orderIdx,
  })),
);

const extraRefs: NewFactRef[] = [
  {
    id: "governance-gov-01-fact-tankrabatt-17-cent",
    itemType: "governance",
    itemId: "gov-01",
    factId: "fact-tankrabatt-17-cent",
    orderIdx: 0,
  },
  {
    id: "cost-tanken-rabatt-diskrepanz-fact-tankrabatt-17-cent",
    itemType: "cost",
    itemId: "tanken-rabatt-diskrepanz",
    factId: "fact-tankrabatt-17-cent",
    orderIdx: 0,
  },
  {
    id: "cascade-cascade-h-fact-gasspeicher-winter-2026",
    itemType: "cascade",
    itemId: "cascade-h",
    factId: "fact-gasspeicher-winter-2026",
    orderIdx: 0,
  },
  {
    id: "governance-gov-03-fact-gasspeicher-winter-2026",
    itemType: "governance",
    itemId: "gov-03",
    factId: "fact-gasspeicher-winter-2026",
    orderIdx: 0,
  },
  {
    id: "indicator-wi-gasspeicher-fuellstand-fact-gasspeicher-winter-2026",
    itemType: "indicator",
    itemId: "wi-gasspeicher-fuellstand",
    factId: "fact-gasspeicher-winter-2026",
    orderIdx: 0,
  },
  {
    id: "cost-heizkosten-winter-fact-gasspeicher-winter-2026",
    itemType: "cost",
    itemId: "heizkosten-winter",
    factId: "fact-gasspeicher-winter-2026",
    orderIdx: 0,
  },
  {
    id: "supply-gasspeicher-winter-fact-gasspeicher-winter-2026",
    itemType: "supply",
    itemId: "gasspeicher-winter",
    factId: "fact-gasspeicher-winter-2026",
    orderIdx: 0,
  },
];

export const FACT_REFS: NewFactRef[] = [...lagebildRefs, ...extraRefs];
