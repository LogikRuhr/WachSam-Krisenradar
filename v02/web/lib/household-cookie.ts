import type { HouseholdHeizart, HouseholdModus } from "./profile";

// Anonymer, rein funktionaler Cookie für die "Eingabe merken"-Funktion des
// Haushalts-Checks auf der Startseite (siehe HouseholdCheck.tsx, app/page.tsx).
// EXAKT nach dem Muster von ws-region (lib/regions.ts): nicht-httpOnly,
// SameSite=Lax, path=/, 1 Jahr Laufzeit. Wert enthält ausschließlich die zwei
// Enum-Werte modus|heizart — keine PLZ, keine ID, keine PII (siehe /datenschutz).

export const HOUSEHOLD_COOKIE = "ws-household";
export const HOUSEHOLD_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 Jahr

const MODUS_VALUES: readonly HouseholdModus[] = ["single", "familie", "selbststaendig", "rentner"];
const HEIZART_VALUES: readonly HouseholdHeizart[] = [
  "gas",
  "oel",
  "fernwaerme",
  "waermepumpe",
  "strom",
  "unbekannt",
];

function isHouseholdModus(value: string): value is HouseholdModus {
  return (MODUS_VALUES as readonly string[]).includes(value);
}

function isHouseholdHeizart(value: string): value is HouseholdHeizart {
  return (HEIZART_VALUES as readonly string[]).includes(value);
}

/** Serialisiert Haushaltstyp und Heizart als Cookie-Wert `modus|heizart`. Keine PII. */
export function serializeHousehold(modus: HouseholdModus, heizart: HouseholdHeizart): string {
  return `${modus}|${heizart}`;
}

export type ParsedHousehold = { modus: HouseholdModus | null; heizart: HouseholdHeizart | null };

/**
 * Parst den ws-household-Cookiewert zurück zu Modus/Heizart. Validiert beide
 * Teile unabhängig gegen die bekannten Enums; fehlende, leere oder unbekannte
 * Teile ergeben null-Felder statt eines Crashs (Client-Eingaben nie vertrauen).
 */
export function parseHousehold(value: string | null | undefined): ParsedHousehold {
  if (!value) return { modus: null, heizart: null };

  const [modusRaw, heizartRaw] = value.split("|");
  const modus = modusRaw && isHouseholdModus(modusRaw) ? modusRaw : null;
  const heizart = heizartRaw && isHouseholdHeizart(heizartRaw) ? heizartRaw : null;
  return { modus, heizart };
}
