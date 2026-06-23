"use client";

import { useMemo, useState } from "react";
import { deriveHouseholdCheck, type HouseholdCheckChain } from "@/lib/household-check";
import { bereichLabel } from "@/lib/personalization";
import type { HouseholdHeizart, HouseholdModus } from "@/lib/profile";

const MODUS_OPTIONS: Array<{ value: HouseholdModus; label: string }> = [
  { value: "single", label: "Single" },
  { value: "familie", label: "Familie" },
  { value: "selbststaendig", label: "Selbstständig" },
  { value: "rentner", label: "Rentebeziehende" },
];

const HEIZART_OPTIONS: Array<{ value: HouseholdHeizart; label: string }> = [
  { value: "gas", label: "Gas" },
  { value: "oel", label: "Öl" },
  { value: "fernwaerme", label: "Fernwärme" },
  { value: "waermepumpe", label: "Wärmepumpe" },
  { value: "strom", label: "Strom direkt" },
  { value: "unbekannt", label: "Weiß ich nicht" },
];

type HouseholdCheckProps = {
  chains: HouseholdCheckChain[];
  connected: boolean;
};

export function HouseholdCheck({ chains, connected }: HouseholdCheckProps) {
  const [modus, setModus] = useState<HouseholdModus>("familie");
  const [heizart, setHeizart] = useState<HouseholdHeizart>("unbekannt");
  const [plz, setPlz] = useState("");

  const result = useMemo(
    () => deriveHouseholdCheck({ profile: { modus, heizart, plz: plz.trim() || null }, chains }),
    [chains, heizart, modus, plz],
  );

  return (
    <section className="household-check" aria-labelledby="household-check-title">
      <div className="household-check-head">
        <p className="mono-label">Haushalts-Check</p>
        <h2 id="household-check-title" className="focus-title">Was betrifft deinen Haushalt?</h2>
        <p>
          Drei kurze Angaben reichen für eine erste Sortierung. WachSam speichert hier nichts und erfindet keine
          individuellen Kostenwerte.
        </p>
      </div>

      <div className="household-check-grid">
        <form className="household-check-form" aria-label="Anonymer Haushalts-Check">
          <label className="auth-label" htmlFor="check-modus">Haushaltstyp</label>
          <select
            className="input-mono"
            id="check-modus"
            value={modus}
            onChange={(event) => setModus(event.target.value as HouseholdModus)}
          >
            {MODUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <label className="auth-label" htmlFor="check-heizart">Heizart</label>
          <select
            className="input-mono"
            id="check-heizart"
            value={heizart}
            onChange={(event) => setHeizart(event.target.value as HouseholdHeizart)}
          >
            {HEIZART_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <label className="auth-label" htmlFor="check-plz">PLZ optional</label>
          <input
            className="input-mono"
            id="check-plz"
            name="plz"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            placeholder="z.B. 45127"
            value={plz}
            onChange={(event) => setPlz(event.target.value.replace(/\D/g, "").slice(0, 5))}
          />
          <p className="household-check-note">{result.privacy}</p>
        </form>

        <div className="household-check-results" aria-live="polite">
          {!connected ? (
            <p className="lead">Datenbank nicht verbunden — der Check zeigt keine erfundenen Ergebnisse.</p>
          ) : chains.length === 0 ? (
            <p className="lead">Aktuell liegen keine veröffentlichten Lagekarten mit Haushaltswirkung vor.</p>
          ) : (
            <>
              <div className="household-result-block">
                <span className="chain-label">Für dich wahrscheinlich relevant</span>
                {result.relevant.slice(0, 2).map((chain) => (
                  <article key={chain.signal.id} className="household-mini-card">
                    <strong>{chain.signal.titel}</strong>
                    <p>{bereichLabel(chain.signal.bereich)} · {chain.signal.beschreibung}</p>
                  </article>
                ))}
              </div>

              <div className="household-result-block">
                <span className="chain-label">Kosten / Versorgung beobachten</span>
                {result.costOrSupply.slice(0, 2).map((chain) => (
                  <article key={`${chain.signal.id}-impact`} className="household-mini-card">
                    <strong>{chain.impact?.titel ?? "Auswirkung in Prüfung"}</strong>
                    <p>{chain.impact?.beschreibung ?? "Noch keine konkrete Haushaltsauswirkung veröffentlicht."}</p>
                  </article>
                ))}
              </div>

              <div className="household-result-block">
                <span className="chain-label">Nächster ruhiger Prüfschritt</span>
                <p>{result.nextStep?.text ?? "Aktuelle Abschläge und Fixkosten ruhig gegen den letzten Verbrauch prüfen."}</p>
              </div>

              {result.notDirectlyRelevant.length > 0 ? (
                <div className="household-result-block">
                  <span className="chain-label">Eher indirekt betroffen</span>
                  <p>
                    {result.notDirectlyRelevant
                      .map((chain) => bereichLabel(chain.signal.bereich))
                      .filter((value, index, all) => all.indexOf(value) === index)
                      .join(", ")}
                  </p>
                </div>
              ) : null}
            </>
          )}
          <p className="household-check-boundary">{result.boundary}</p>
        </div>
      </div>
    </section>
  );
}
