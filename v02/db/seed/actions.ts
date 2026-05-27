import type { InferInsertModel } from "drizzle-orm";
import { citizenActions } from "../schema";
import { CITIZEN_ACTIONS as sourceCitizenActions } from "./source-data/actions";

export type NewCitizenAction = InferInsertModel<typeof citizenActions>;

type SourceAufwand = "minimal" | "gering" | "mittel" | "hoch";
const mapAufwand = (aufwand: SourceAufwand): NewCitizenAction["aufwand"] => {
  if (aufwand === "minimal" || aufwand === "gering") return "niedrig";
  return aufwand;
};

export const CITIZEN_ACTIONS: NewCitizenAction[] = sourceCitizenActions.map((item) => ({
  id: item.id,
  bereich: item.bezugZuBereich[0] ?? "gesellschaft",
  titel: item.titel,
  beschreibung: item.beschreibung,
  aufwand: mapAufwand(item.aufwand),
  bezugZuBereich: [...item.bezugZuBereich],
  causalLinks: item.causalLinks ?? [],
}));
