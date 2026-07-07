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
  primaryAction: HouseholdCheckChain | null;
  secondaryRelevant: HouseholdCheckChain[];
  secondaryCostOrSupply: HouseholdCheckChain[];
  indirectAreas: string[];
  nextStep: { key: string; text: string } | null;
  notDirectlyRelevant: HouseholdCheckChain[];
  boundary: string;
  privacy: string;
};

const BOUNDARY =
  "Orientierung, keine Beratung: WachSam zeigt mögliche Haushaltswirkungen und €/Monat-Bandbreiten mit Annahmen, keine sichere Vorhersage.";

const PRIVACY =
  "Anonyme Check-Angaben werden nicht gespeichert. PLZ wird in dieser Welle nicht für regionale Fakten genutzt.";

export function deriveHouseholdCheck(input: {
  profile: AnonymousHouseholdProfile;
  chains: HouseholdCheckChain[];
}): HouseholdCheckResult {
  const sorted = prioritizeSignalsForProfile(input.chains, { heizart: input.profile.heizart });
  const prioritized = sorted.slice(0, 3);
  const costOrSupply = sorted.filter((chain) => chain.impact !== null).slice(0, 3);
  const actionable = sorted.filter((chain) => chain.action !== null);
  const nextStep = householdCheckSteps(input.profile)[0] ?? null;
  const primaryConcern = prioritized[0] ?? null;
  const primaryImpact = costOrSupply[0] ?? null;
  const primaryAction =
    actionable.find((chain) => chain.signal.id === primaryConcern?.signal.id) ??
    actionable.find((chain) => chain.signal.id === primaryImpact?.signal.id) ??
    actionable[0] ??
    null;
  const secondaryRelevant = primaryConcern
    ? prioritized.filter((chain) => chain.signal.id !== primaryConcern.signal.id).slice(0, 2)
    : [];
  const secondaryCostOrSupply = primaryImpact
    ? costOrSupply.filter((chain) => chain.signal.id !== primaryImpact.signal.id).slice(0, 2)
    : [];
  const visibleIds = new Set([...prioritized, ...costOrSupply].map((chain) => chain.signal.id));
  const notDirectlyRelevant = input.chains.filter((chain) => !visibleIds.has(chain.signal.id)).slice(0, 2);
  const indirectAreas = Array.from(new Set(notDirectlyRelevant.map((chain) => chain.signal.bereich))).slice(0, 3);

  return {
    relevant: prioritized,
    costOrSupply,
    primaryConcern,
    primaryImpact,
    primaryAction,
    secondaryRelevant,
    secondaryCostOrSupply,
    indirectAreas,
    nextStep,
    notDirectlyRelevant,
    boundary: BOUNDARY,
    privacy: PRIVACY,
  };
}
