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
  titleId?: string;
  headingLevel?: "h1" | "h2";
  sourceCount?: number;
  latestStand?: string | null;
};

export function HouseholdCheck({
  chains,
  connected,
  titleId = "household-check-title",
  headingLevel = "h2",
  sourceCount = 0,
  latestStand,
}: HouseholdCheckProps) {
  const [modus, setModus] = useState<HouseholdModus>("familie");
  const [heizart, setHeizart] = useState<HouseholdHeizart>("unbekannt");
  const [plz, setPlz] = useState("");

  const result = useMemo(
    () => deriveHouseholdCheck({ profile: { modus, heizart, plz: plz.trim() || null }, chains }),
    [chains, heizart, modus, plz],
  );
  const Heading = headingLevel;
  const ready = connected && chains.length > 0;
  const statusText = connected ? (chains.length > 0 ? "Daten verbunden" : "Keine Lagekarten freigegeben") : "Datenpfad blockiert";
  const sourceText = connected && sourceCount > 0 ? `${sourceCount} Quellen` : "Quellen ausstehend";
  const standText = latestStand ?? "Stand ausstehend";

  return (
    <section className="household-check" aria-labelledby={titleId}>
      <div className="household-check-head">
        <p className="mono-label">Haushalts-Cockpit</p>
        <Heading id={titleId} className="app-title">Was betrifft meinen Haushalt jetzt?</Heading>
        <p>
          Drei kurze Angaben reichen fuer eine erste Sortierung. WachSam zeigt nur veroeffentlichte Lagekarten,
          Quellenstand und ruhige Pruefschritte.
        </p>
        <div className="household-status-row" aria-label="Datenstatus des Haushalts-Checks">
          <span className={`household-status-card${ready ? " household-status-card-ready" : ""}`}>
            <strong>{statusText}</strong>
            <small>{ready ? "Check kann Treffer sortieren" : "Keine erfundenen Treffer"}</small>
          </span>
          <span className="household-status-card">
            <strong>{sourceText}</strong>
            <small>sichtbar mit Quellenstand</small>
          </span>
          <span className="household-status-card">
            <strong>{standText}</strong>
            <small>Datenstand</small>
          </span>
        </div>
      </div>

      <div className="household-check-grid">
        <form className="household-check-form" aria-label="Anonymer Haushalts-Check">
          <div className="household-field">
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
          </div>

          <div className="household-field">
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
          </div>

          <div className="household-field household-field-wide">
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
          </div>
          <p className="household-check-note">{result.privacy}</p>
        </form>

        <div className="household-check-results" aria-live="polite">
          {!connected ? (
            <div className="household-result-summary household-result-blocked">
              <span className="chain-label">Aktueller Status</span>
              <strong>Datenbank nicht verbunden</strong>
              <p>Der Check bleibt nutzbar als Eingabe, zeigt aber keine Treffer, solange keine veroeffentlichten Daten geladen sind.</p>
              <p>{result.nextStep?.text ?? "Aktuelle Abschlaege und Fixkosten ruhig gegen den letzten Verbrauch pruefen."}</p>
            </div>
          ) : chains.length === 0 ? (
            <div className="household-result-summary household-result-blocked">
              <span className="chain-label">Aktueller Status</span>
              <strong>Keine Haushaltswirkung freigegeben</strong>
              <p>Aktuell liegen keine veroeffentlichten Lagekarten mit Haushaltswirkung vor.</p>
              <p>{result.nextStep?.text ?? "Aktuelle Abschlaege und Fixkosten ruhig gegen den letzten Verbrauch pruefen."}</p>
            </div>
          ) : (
            <>
              <div className="household-result-summary">
                <span className="chain-label">Deine erste Einordnung</span>
                <strong>{result.primaryConcern?.signal.titel ?? "Keine priorisierte Lagekarte"}</strong>
                <p>
                  {result.primaryImpact?.impact?.titel
                    ? `${result.primaryImpact.impact.titel}: ${result.primaryImpact.impact.beschreibung}`
                    : "Fuer diese Auswahl ist noch keine konkrete Kosten- oder Versorgungswirkung freigegeben."}
                </p>
              </div>

              <div className="household-result-block">
                <span className="chain-label">Für dich wahrscheinlich relevant</span>
                {result.relevant.length > 0 ? (
                  result.relevant.slice(0, 2).map((chain) => (
                    <article key={chain.signal.id} className="household-mini-card">
                      <strong>{chain.signal.titel}</strong>
                      <p>{bereichLabel(chain.signal.bereich)} · {chain.signal.beschreibung}</p>
                    </article>
                  ))
                ) : (
                  <p>Keine priorisierten Treffer fuer diese Auswahl.</p>
                )}
              </div>

              <div className="household-result-block">
                <span className="chain-label">Kosten / Versorgung beobachten</span>
                {result.costOrSupply.length > 0 ? (
                  result.costOrSupply.slice(0, 2).map((chain) => (
                    <article key={`${chain.signal.id}-impact`} className="household-mini-card">
                      <strong>{chain.impact?.titel ?? "Auswirkung in Prüfung"}</strong>
                      <p>{chain.impact?.beschreibung ?? "Noch keine konkrete Haushaltsauswirkung veröffentlicht."}</p>
                    </article>
                  ))
                ) : (
                  <p>Noch keine konkrete Kosten- oder Versorgungswirkung veroeffentlicht.</p>
                )}
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
