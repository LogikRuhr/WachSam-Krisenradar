import { indicatorVitals, type Zone } from "./indicator-zones";

export type PriceRadarGroup = "fuel" | "energy";
export type PriceRadarSourceMode = "live-sample" | "editorial";

export type PriceRadarIndicatorInput = {
  id: string;
  label: string;
  unit: string | null;
  currentValue: string | number | null;
  previousValue: string | number | null;
  currentValueDate: Date | null;
  thresholdWarn: string | number | null;
  thresholdCritical: string | number | null;
  scaleDirection: string;
  zoneTextUncritical: string | null;
  zoneTextElevated: string | null;
  zoneTextCritical: string | null;
};

export type PriceRadarSourceHealthInput = {
  sourceName: string;
  target: string;
  status: string;
  lastSuccessAt: Date | null;
  lastCheckedAt: Date;
  itemCount: number;
  errorCount: number;
};

export type PriceRadarCard = {
  id: string;
  label: string;
  group: PriceRadarGroup;
  description: string;
  href: string | null;
  sourceName: string;
  sourceMode: PriceRadarSourceMode;
  sourceNote: string;
  value: number | null;
  unit: string | null;
  stand: Date | null;
  pending: boolean;
  zone: Zone | null;
  zoneLabel: string | null;
  sourceStatus: string | null;
  sourceStatusLabel: string;
  sourceStatusTone: "uncritical" | "elevated" | "critical" | "none";
};

type PriceRadarDefinition = {
  id: string;
  label: string;
  group: PriceRadarGroup;
  description: string;
  sourceName: string;
  sourceMode: PriceRadarSourceMode;
  sourceNote: string;
  healthMatch?: string;
};

const DEFINITIONS: readonly PriceRadarDefinition[] = [
  {
    id: "wi-kraftstoffpreis-super-e5",
    label: "Super E5",
    group: "fuel",
    description: "Tankstellenpreis aus offener 16-PLZ-Stichprobe.",
    sourceName: "Tankerkönig MTS-K",
    sourceMode: "live-sample",
    sourceNote: "Stichprobe, kein offizieller Deutschland-Schnitt.",
    healthMatch: "tankerkoenig",
  },
  {
    id: "wi-kraftstoffpreis-super-e10",
    label: "Super E10",
    group: "fuel",
    description: "Tankstellenpreis aus offener 16-PLZ-Stichprobe.",
    sourceName: "Tankerkönig MTS-K",
    sourceMode: "live-sample",
    sourceNote: "Stichprobe, kein offizieller Deutschland-Schnitt.",
    healthMatch: "tankerkoenig",
  },
  {
    id: "wi-kraftstoffpreis-diesel",
    label: "Diesel",
    group: "fuel",
    description: "Tankstellenpreis aus offener 16-PLZ-Stichprobe.",
    sourceName: "Tankerkönig MTS-K",
    sourceMode: "live-sample",
    sourceNote: "Stichprobe, kein offizieller Deutschland-Schnitt.",
    healthMatch: "tankerkoenig",
  },
  {
    id: "wi-strompreis-haushalt",
    label: "Strom Haushalte",
    group: "energy",
    description: "BDEW-Durchschnitt verfügbarer Haushaltstarife.",
    sourceName: "BDEW Strompreisanalyse",
    sourceMode: "editorial",
    sourceNote: "Redaktioneller Monatsstand, kein individueller Tarif.",
  },
  {
    id: "wi-gaspreis-haushalt-efh",
    label: "Gas Haushalte",
    group: "energy",
    description: "BDEW-Durchschnitt für Einfamilienhaus-Verbrauch.",
    sourceName: "BDEW Gaspreisanalyse",
    sourceMode: "editorial",
    sourceNote: "Redaktioneller Monatsstand, kein individueller Tarif.",
  },
];

export const PRICE_RADAR_INDICATOR_IDS = DEFINITIONS.map((item) => item.id);

const SOURCE_STATUS_LABEL: Record<string, { label: string; tone: PriceRadarCard["sourceStatusTone"] }> = {
  fresh: { label: "Quelle aktuell", tone: "uncritical" },
  stale: { label: "Quelle veraltet", tone: "elevated" },
  error: { label: "Quellenfehler", tone: "critical" },
  anomaly: { label: "Auffällig", tone: "elevated" },
  disabled: { label: "Deaktiviert", tone: "none" },
  unknown: { label: "Status offen", tone: "none" },
};

function sourceHealthFor(definition: PriceRadarDefinition, healthRows: PriceRadarSourceHealthInput[]) {
  if (!definition.healthMatch) return null;
  const needle = definition.healthMatch.toLocaleLowerCase("de-DE");
  return healthRows.find((row) =>
    `${row.sourceName} ${row.target}`.toLocaleLowerCase("de-DE").includes(needle),
  ) ?? null;
}

function sourceStatus(definition: PriceRadarDefinition, health: PriceRadarSourceHealthInput | null) {
  if (health) return SOURCE_STATUS_LABEL[health.status] ?? { label: health.status, tone: "none" as const };
  if (definition.sourceMode === "editorial") return { label: "Redaktioneller Stand", tone: "none" as const };
  return { label: "Quelle ausstehend", tone: "none" as const };
}

export function buildPriceRadar(
  indicators: PriceRadarIndicatorInput[],
  healthRows: PriceRadarSourceHealthInput[] = [],
): PriceRadarCard[] {
  const byId = new Map(indicators.map((indicator) => [indicator.id, indicator]));

  return DEFINITIONS.map((definition) => {
    const indicator = byId.get(definition.id) ?? null;
    const vitals = indicator ? indicatorVitals(indicator) : null;
    const health = sourceHealthFor(definition, healthRows);
    const status = sourceStatus(definition, health);

    return {
      id: definition.id,
      label: definition.label,
      group: definition.group,
      description: definition.description,
      href: indicator ? `/indikatoren/${definition.id}` : null,
      sourceName: definition.sourceName,
      sourceMode: definition.sourceMode,
      sourceNote: definition.sourceNote,
      value: vitals?.currentValue ?? null,
      unit: indicator?.unit ?? null,
      stand: vitals?.currentValueDate ?? null,
      pending: vitals?.pending ?? true,
      zone: vitals?.zone?.zone ?? null,
      zoneLabel: vitals?.zone?.zoneLabel ?? null,
      sourceStatus: health?.status ?? null,
      sourceStatusLabel: status.label,
      sourceStatusTone: status.tone,
    };
  });
}
