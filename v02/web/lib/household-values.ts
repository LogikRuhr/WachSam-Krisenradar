// Kanonische Enum-Werte für Haushaltsmodus und Heizart. Single Source of
// Truth für lib/profile.ts (Server Actions, "use server" — kann daher selbst
// keine Konstanten exportieren, siehe https://nextjs.org/docs/messages/invalid-use-server-value)
// und lib/household-cookie.ts (Cookie-Validierung).

export const MODUS_VALUES = ["single", "familie", "selbststaendig", "rentner"] as const;
export const HEIZART_VALUES = ["gas", "oel", "fernwaerme", "waermepumpe", "strom", "unbekannt"] as const;
