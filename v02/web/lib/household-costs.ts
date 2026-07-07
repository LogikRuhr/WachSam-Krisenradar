import { estimateHeatingRange, estimateMobilityRange, type CostObservation } from "./cost-model";
import type { HouseholdHeizart, HouseholdModus } from "./profile";

export const HOUSEHOLD_COST_INDICATOR_IDS = ["wi-kraftstoffpreis-diesel", "wi-gaspreis-haushalt-efh"] as const;

export type HouseholdCostIndicatorId = (typeof HOUSEHOLD_COST_INDICATOR_IDS)[number];

export type HouseholdCostInput = {
  id: HouseholdCostIndicatorId;
  label: string;
  unit: string | null;
  sourceName: string | null;
  currentValueDate: string | null;
  observations: Array<{ observedAt: string; value: string }>;
};

export type HouseholdCostRange = {
  key: "mobility" | "heating";
  title: string;
  amountMinEur: number;
  amountMaxEur: number;
  window: string;
  assumptions: string;
  basis: string;
  sourceName: string | null;
  stand: string | null;
  indicatorId: HouseholdCostIndicatorId;
};

export type HouseholdCostUnavailable = {
  key: "mobility" | "heating";
  title: string;
  reason: string;
};

export type HouseholdCostView = {
  ranges: HouseholdCostRange[];
  unavailable: HouseholdCostUnavailable[];
  boundary: string;
};

export type HouseholdCostProfile = {
  modus: HouseholdModus | null;
  heizart: HouseholdHeizart | null;
};

type ConsumptionRange = { min: number; max: number; label: string };

const BOUNDARY = "Modellbandbreite, keine Beratung und keine Vorhersage.";

const MOBILITY_BY_MODUS: Record<HouseholdModus, ConsumptionRange> = {
  single: { min: 30, max: 70, label: "Single-/kleiner Haushalt, redaktionelle Modellbandbreite" },
  familie: { min: 60, max: 120, label: "Familienhaushalt, redaktionelle Modellbandbreite" },
  selbststaendig: { min: 70, max: 160, label: "Selbstständige, redaktionelle Modellbandbreite" },
  rentner: { min: 20, max: 60, label: "Rentebeziehende, redaktionelle Modellbandbreite" },
};

const GAS_BY_MODUS: Record<HouseholdModus, ConsumptionRange> = {
  single: { min: 700, max: 1200, label: "Single-/kleiner Haushalt, redaktionelle Modellbandbreite" },
  familie: { min: 1200, max: 2200, label: "Familienhaushalt, redaktionelle Modellbandbreite" },
  selbststaendig: { min: 900, max: 1900, label: "Selbstständige, redaktionelle Modellbandbreite" },
  rentner: { min: 800, max: 1600, label: "Rentebeziehende, redaktionelle Modellbandbreite" },
};

const HEATING_LABEL_BY_TYPE: Record<Exclude<HouseholdHeizart, "gas" | "unbekannt">, string> = {
  oel: "Öl",
  fernwaerme: "Fernwärme",
  waermepumpe: "Wärmepumpe",
  strom: "Strom direkt",
};

function parseObservations(input: HouseholdCostInput | undefined): CostObservation[] {
  if (!input) return [];
  return input.observations
    .map((observation) => ({ observedAt: new Date(observation.observedAt), value: observation.value }))
    .filter((observation) => !Number.isNaN(observation.observedAt.getTime()));
}

function inputById(inputs: HouseholdCostInput[]): Map<HouseholdCostIndicatorId, HouseholdCostInput> {
  return new Map(inputs.map((input) => [input.id, input]));
}

export function deriveHouseholdCostView(input: {
  profile: HouseholdCostProfile;
  inputs: HouseholdCostInput[];
}): HouseholdCostView {
  const modus = input.profile.modus ?? "familie";
  const byId = inputById(input.inputs);
  const ranges: HouseholdCostRange[] = [];
  const unavailable: HouseholdCostUnavailable[] = [];

  const mobilityInput = byId.get("wi-kraftstoffpreis-diesel");
  const mobilityRange = estimateMobilityRange(parseObservations(mobilityInput), MOBILITY_BY_MODUS[modus]);
  if (mobilityInput && mobilityRange) {
    ranges.push({
      key: "mobility",
      title: "Mobilität",
      amountMinEur: mobilityRange.monthlyDeltaMinEur,
      amountMaxEur: mobilityRange.monthlyDeltaMaxEur,
      window: mobilityRange.window,
      assumptions: mobilityRange.assumptions,
      basis: mobilityRange.basis,
      sourceName: mobilityInput.sourceName,
      stand: mobilityInput.currentValueDate,
      indicatorId: mobilityInput.id,
    });
  } else {
    unavailable.push({
      key: "mobility",
      title: "Mobilität",
      reason: "Für Kraftstoff liegt aktuell kein belastbares Vergleichsfenster vor.",
    });
  }

  const heizart = input.profile.heizart ?? "unbekannt";
  if (heizart === "gas") {
    const heatingInput = byId.get("wi-gaspreis-haushalt-efh");
    const heatingRange = estimateHeatingRange(parseObservations(heatingInput), heatingInput?.unit ?? null, GAS_BY_MODUS[modus]);
    if (heatingInput && heatingRange) {
      ranges.push({
        key: "heating",
        title: "Heizen",
        amountMinEur: heatingRange.monthlyDeltaMinEur,
        amountMaxEur: heatingRange.monthlyDeltaMaxEur,
        window: heatingRange.window,
        assumptions: heatingRange.assumptions,
        basis: heatingRange.basis,
        sourceName: heatingInput.sourceName,
        stand: heatingInput.currentValueDate,
        indicatorId: heatingInput.id,
      });
    } else {
      unavailable.push({
        key: "heating",
        title: "Heizen",
        reason: "Für Gas liegt aktuell kein belastbares Vergleichsfenster vor.",
      });
    }
  } else if (heizart === "unbekannt") {
    unavailable.push({
      key: "heating",
      title: "Heizen",
      reason: "Heizart wählen, damit WachSam die passende Heizkosten-Spanne prüfen kann.",
    });
  } else {
    unavailable.push({
      key: "heating",
      title: "Heizen",
      reason: `Für ${HEATING_LABEL_BY_TYPE[heizart]} ist noch keine belastbare €/Monat-Spanne hinterlegt.`,
    });
  }

  return { ranges, unavailable, boundary: BOUNDARY };
}
