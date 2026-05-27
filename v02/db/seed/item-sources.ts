import type { InferInsertModel } from "drizzle-orm";
import { itemSources } from "../schema";
import type { Source, WithSources } from "./_helpers";
import cascadeData from "./source-data/cascades.json";
import costData from "./source-data/costImpacts.json";
import governanceData from "./source-data/governance.json";
import lagebildData from "./source-data/lagebild.json";
import { CITIZEN_ACTIONS as sourceCitizenActions } from "./source-data/actions";
import { SUPPLY_RISKS as sourceSupplyRisks } from "./source-data/supply-risks";
import indicatorData from "./source-data/warning-indicators.json";

export type NewItemSource = InferInsertModel<typeof itemSources>;

type ItemType = NewItemSource["itemType"];

const rowsFor = (itemType: ItemType, items: readonly WithSources[]): NewItemSource[] =>
  items.flatMap((item) =>
    (item.sources ?? []).map((source: Source, orderIdx: number) => ({
      id: `${itemType}-${item.id}-${orderIdx}`,
      itemType,
      itemId: item.id,
      sourceName: source.name,
      sourceUrl: source.url,
      sourceStand: source.stand,
      orderIdx,
    })),
  );

export const ITEM_SOURCES: NewItemSource[] = [
  ...rowsFor("lagebild", lagebildData),
  ...rowsFor("cascade", cascadeData.cascades),
  ...rowsFor("governance", governanceData.items),
  ...rowsFor("indicator", indicatorData.indicators),
  ...rowsFor("cost", costData),
  ...rowsFor("supply", sourceSupplyRisks),
  ...rowsFor("action", sourceCitizenActions),
];
