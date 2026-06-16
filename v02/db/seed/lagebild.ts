import type { InferInsertModel } from "drizzle-orm";
import { lagebildItems } from "../schema";
import { dateOrNull } from "./_helpers";
import lagebildData from "./source-data/lagebild.json";

export type NewLagebildItem = InferInsertModel<typeof lagebildItems>;

const FACT_IDS_BY_LAGEBILD_ID: Record<string, string[]> = {
  "energie-oel-hormus": ["fact-wachstum-2026-halbiert"],
  "lebensmittel-preisdruck": ["fact-fao-food-2026-03"],
  "infrastruktur-stromnetz": ["fact-bsi-stadtwerke-97"],
  "industrie-arbeit": ["fact-arbeitslose-jan-2026", "fact-wachstum-2026-halbiert"],
  "gesellschaft-vertrauen": ["fact-vertrauen-89"],
  "mobilitaetskosten-kraftstoffe": ["fact-destatis-kraftstoffe-2026-04"],
  "arbeit-arbeitsmarkt-druck": ["fact-arbeitslose-jan-2026", "fact-wachstum-2026-halbiert"],
  "finanzen-inflation-kaufkraft": ["fact-iw-inflation-2026"],
  "gesundheit-arzneimittelversorgung": ["fact-bfarm-engpaesse-2026"],
  "logistik-post-qualitaet": ["fact-post-schlichtung-2026"],
};

export const LAGEBILD_ITEMS: NewLagebildItem[] = lagebildData.map((item) => ({
  id: item.id,
  bereich: item.bereich,
  titel: item.titel,
  beschreibung: item.beschreibung,
  severity: item.severity,
  trend: item.trend,
  primaerindikator: item.primaerindikator,
  confidence: item.confidence,
  evidenceType: item.evidence_type as NewLagebildItem["evidenceType"],
  factIds: FACT_IDS_BY_LAGEBILD_ID[item.id] ?? [],
  retrievedAt: dateOrNull(item.retrieved_at),
}));
