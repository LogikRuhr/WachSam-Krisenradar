import { householdCheckSteps, prioritizeSignalsForProfile } from "./personalization";
import type { HouseholdHeizart, HouseholdModus } from "./profile";
export type HouseholdCheckChain = {
  signal: { id: string; bereich: string; severity: string; trend: string; titel: string; beschreibung: string };
  impact: { kind: "cost" | "supply"; bereich: string; titel: string; beschreibung: string; confidence: string; zeithorizont: string } | null;
  action: { titel: string; beschreibung: string; aufwand: string } | null;
};

export type AnonymousHouseholdProfile = {
  modus: HouseholdModus | null;
  heizart: HouseholdHeizart | null;
  plz: string | null;
};

export type HouseholdCheckResult = {
  relevant: HouseholdCheckChain[];
  costOrSupply: HouseholdCheckChain[];
  primaryConcern: HouseholdCheckChain | null;
  primaryImpact: HouseholdCheckChain | null;
  nextStep: { key: string; text: string } | null;
  notDirectlyRelevant: HouseholdCheckChain[];
  boundary: string;
  privacy: string;
};

const BOUNDARY =
  "Orientierung, keine Beratung: WachSam zeigt mögliche Haushaltswirkungen, keine sichere Vorhersage und keine individuellen Euro-Beträge.";

const PRIVACY =
  "Anonyme Check-Angaben werden nicht gespeichert. PLZ wird in dieser Welle nicht für regionale Fakten genutzt.";

export function deriveHouseholdCheck(input: {
  profile: AnonymousHouseholdProfile;
  chains: HouseholdCheckChain[];
}): HouseholdCheckResult {
  const prioritized = prioritizeSignalsForProfile(input.chains, { heizart: input.profile.heizart }, 3);
  const costOrSupply = prioritized.filter((chain) => chain.impact !== null).slice(0, 3);
  const nextStep = householdCheckSteps(input.profile)[0] ?? null;
  const relevantIds = new Set(prioritized.map((chain) => chain.signal.id));
  const notDirectlyRelevant = input.chains.filter((chain) => !relevantIds.has(chain.signal.id)).slice(0, 2);
  const primaryConcern = prioritized[0] ?? null;
  const primaryImpact = costOrSupply[0] ?? null;

  return {
    relevant: prioritized,
    costOrSupply,
    primaryConcern,
    primaryImpact,
    nextStep,
    notDirectlyRelevant,
    boundary: BOUNDARY,
    privacy: PRIVACY,
  };
}
