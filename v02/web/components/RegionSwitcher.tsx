"use client";

import { useRouter } from "next/navigation";
import { BUNDESLAENDER, REGION_COOKIE } from "@/lib/regions";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 Jahr

/**
 * Bundesland-Filter für die Warnlage-Karte auf /radar. Schreibt einen rein
 * funktionalen, nicht-httpOnly Cookie (`ws-region`, nur ein Bundesland-Kürzel,
 * keine PII — siehe /datenschutz) und lädt die Seite serverseitig neu, damit
 * `getRadarThemes()` (radar-data.ts) den Filter greift. Keine Server Action
 * nötig: der Cookie ist anonym und nicht an ein Nutzerkonto gebunden.
 */
export function RegionSwitcher({ currentRegion }: { currentRegion: string | null }) {
  const router = useRouter();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    document.cookie = value
      ? `${REGION_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
      : `${REGION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="region-switcher">
      <label className="auth-label" htmlFor="region-select">Bundesland</label>
      <select
        aria-label="Bundesland für die Warnlage auswählen"
        className="input-mono"
        defaultValue={currentRegion ?? ""}
        id="region-select"
        onChange={onChange}
      >
        <option value="">Bundesweit</option>
        {BUNDESLAENDER.map((land) => (
          <option key={land.code} value={land.code}>
            {land.name}
          </option>
        ))}
      </select>
    </div>
  );
}
