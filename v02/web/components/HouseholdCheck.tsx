"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deriveHouseholdCostView, type HouseholdCostInput, type HouseholdCostView } from "@/lib/household-costs";
import { deriveHouseholdCheck, type HouseholdCheckChain } from "@/lib/household-check";
import { HOUSEHOLD_COOKIE, HOUSEHOLD_COOKIE_MAX_AGE_SECONDS, serializeHousehold } from "@/lib/household-cookie";
import { buildPublicOnboardingSteps } from "@/lib/onboarding";
import { aufwandLabel, bereichLabel } from "@/lib/personalization";
import type { HouseholdHeizart, HouseholdModus } from "@/lib/profile";
import { OnboardingChecklist } from "./OnboardingChecklist";

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
  costInputs?: HouseholdCostInput[];
  titleId?: string;
  headingLevel?: "h1" | "h2";
  sourceCount?: number;
  latestStand?: string | null;
  /** Gemerkte anonyme Eingabe aus dem ws-household-Cookie (siehe app/page.tsx). */
  initialModus?: HouseholdModus;
  initialHeizart?: HouseholdHeizart;
};

const COST_DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

function formatCostDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : COST_DATE_FMT.format(date);
}

function formatSignedEuro(value: number): string {
  if (value === 0) return "0 €";
  return `${value > 0 ? "+" : "-"}${Math.abs(value)} €`;
}

function formatCostRange(min: number, max: number): string {
  if (min === max) return `ca. ${formatSignedEuro(min)}/Monat`;
  return `ca. ${formatSignedEuro(min)} bis ${formatSignedEuro(max)}/Monat`;
}

function HouseholdCostPanel({ view }: { view: HouseholdCostView }) {
  return (
    <div className="household-cost-panel" aria-label="Monatliche Kostenspanne">
      <span className="chain-label">Monatliche Spanne</span>
      {view.ranges.map((range) => {
        const stand = formatCostDate(range.stand);
        return (
          <div key={range.key} className="household-cost-row">
            <div>
              <strong>{range.title}</strong>
              <small>{range.basis} · {range.window}</small>
              <p>
                {range.assumptions}
                {range.sourceName ? ` · Quelle: ${range.sourceName}` : ""}
                {stand ? ` · Stand: ${stand}` : ""}
              </p>
            </div>
            <strong className="household-cost-value">{formatCostRange(range.amountMinEur, range.amountMaxEur)}</strong>
          </div>
        );
      })}
      {view.unavailable.map((item) => (
        <div key={item.key} className="household-cost-row household-cost-empty">
          <div>
            <strong>{item.title}</strong>
            <p>{item.reason}</p>
          </div>
          <strong className="household-cost-value">keine belastbare €/Monat-Spanne</strong>
        </div>
      ))}
      <p className="household-cost-note">{view.boundary}</p>
    </div>
  );
}

export function HouseholdCheck({
  chains,
  connected,
  costInputs = [],
  titleId = "household-check-title",
  headingLevel = "h2",
  sourceCount = 0,
  latestStand,
  initialModus,
  initialHeizart,
}: HouseholdCheckProps) {
  const router = useRouter();
  const [modus, setModus] = useState<HouseholdModus>(initialModus ?? "familie");
  const [heizart, setHeizart] = useState<HouseholdHeizart>(initialHeizart ?? "unbekannt");
  const [hasAdjustedProfile, setHasAdjustedProfile] = useState(false);

  function rememberHousehold(nextModus: HouseholdModus, nextHeizart: HouseholdHeizart) {
    document.cookie = `${HOUSEHOLD_COOKIE}=${serializeHousehold(nextModus, nextHeizart)}; path=/; max-age=${HOUSEHOLD_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    router.refresh();
  }

  const result = useMemo(
    () => deriveHouseholdCheck({ profile: { modus, heizart }, chains }),
    [chains, heizart, modus],
  );
  const costView = useMemo(
    () => deriveHouseholdCostView({ profile: { modus, heizart }, inputs: costInputs }),
    [costInputs, heizart, modus],
  );
  const Heading = headingLevel;
  const ready = connected && chains.length > 0;
  const statusText = connected ? (chains.length > 0 ? "Daten verbunden" : "Keine Lagekarten freigegeben") : "Datenpfad blockiert";
  const sourceText = connected && sourceCount > 0 ? `${sourceCount} Quellen` : "Quellen ausstehend";
  const standText = latestStand ?? "Stand ausstehend";
  const nextStepText = result.nextStep?.text ?? "Aktuelle Abschläge und Fixkosten ruhig gegen den letzten Verbrauch prüfen.";
  const hasResultDetails =
    result.secondaryRelevant.length > 0 || result.secondaryCostOrSupply.length > 0 || result.indirectAreas.length > 0;
  const hasProfileInput = hasAdjustedProfile || heizart !== "unbekannt";
  const hasFirstValue =
    connected && hasProfileInput && (result.primaryConcern !== null || result.primaryImpact !== null || result.primaryAction !== null);
  const showCostPanel = connected && (costView.ranges.length > 0 || costView.unavailable.length > 0);
  const primaryAction = result.primaryAction?.action ?? null;
  const onboardingSteps = buildPublicOnboardingSteps({
    hasProfileInput,
    connected,
    hasPublishedSignals: chains.length > 0,
    hasResult: result.primaryConcern !== null,
    hasNextStep: result.nextStep !== null,
    hasAction: primaryAction !== null,
  });

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
            <small>Lagebild-Stand</small>
          </span>
        </div>
      </div>

      <OnboardingChecklist
        title="In drei Schritten zum ersten WachSam-Wert"
        label="Erste Schritte"
        description="Kein Rundgang, kein Zwang: erst Haushalt einordnen, dann Wirkung lesen, dann einen ruhigen Prüfschritt mitnehmen."
        steps={onboardingSteps}
        compact
      />

      <div className="household-check-grid">
        <form className="household-check-form" aria-label="Anonymer Haushalts-Check">
          <div className="household-field">
            <label className="auth-label" htmlFor="check-modus">Haushaltstyp</label>
            <select
              className="input-mono"
              id="check-modus"
              value={modus}
              onChange={(event) => {
                const nextModus = event.target.value as HouseholdModus;
                setModus(nextModus);
                setHasAdjustedProfile(true);
                rememberHousehold(nextModus, heizart);
              }}
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
              onChange={(event) => {
                const nextHeizart = event.target.value as HouseholdHeizart;
                setHeizart(nextHeizart);
                setHasAdjustedProfile(true);
                rememberHousehold(modus, nextHeizart);
              }}
            >
              {HEIZART_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <p className="household-check-note">{result.privacy}</p>
        </form>

        <div className="household-check-results">
          {!connected ? (
            <>
              <div className="household-result-summary household-result-blocked" aria-live="polite">
                <span className="chain-label">Aktueller Status</span>
                <strong>Datenbank nicht verbunden</strong>
                <p>Der Check bleibt nutzbar als Eingabe, zeigt aber keine Treffer, solange keine veroeffentlichten Daten geladen sind.</p>
                <div className="household-result-next">
                  <span>Nächster Prüfschritt</span>
                  <p>{nextStepText}</p>
                </div>
                {showCostPanel ? <HouseholdCostPanel view={costView} /> : null}
              </div>
              <p className="household-check-boundary">{result.boundary}</p>
            </>
          ) : chains.length === 0 ? (
            <>
              <div className="household-result-summary household-result-blocked" aria-live="polite">
                <span className="chain-label">Aktueller Status</span>
                <strong>Keine Haushaltswirkung freigegeben</strong>
                <p>Aktuell liegen keine veroeffentlichten Lagekarten mit Haushaltswirkung vor.</p>
                <div className="household-result-next">
                  <span>Nächster Prüfschritt</span>
                  <p>{nextStepText}</p>
                </div>
              </div>
              <p className="household-check-boundary">{result.boundary}</p>
            </>
          ) : (
            <>
              <div className="household-result-summary" aria-live="polite">
                <div className="household-result-kicker">
                  <span className="chain-label">Deine erste Einordnung</span>
                  {hasFirstValue ? <span className="household-activation-chip">Erster WachSam-Wert erreicht</span> : null}
                </div>
                <strong>{result.primaryConcern?.signal.titel ?? "Keine priorisierte Lagekarte"}</strong>
                <p>
                  {result.primaryImpact?.impact?.titel
                    ? `${result.primaryImpact.impact.titel}: ${result.primaryImpact.impact.beschreibung}`
                    : "Fuer diese Auswahl ist noch keine konkrete Kosten- oder Versorgungswirkung freigegeben."}
                </p>
                {showCostPanel ? <HouseholdCostPanel view={costView} /> : null}
                <div className="household-result-next">
                  <span>Nächster Prüfschritt</span>
                  <p>{nextStepText}</p>
                </div>
                {primaryAction ? (
                  <div className="household-result-action">
                    <span>Passende Maßnahme</span>
                    <strong>{primaryAction.titel}</strong>
                    <p>{primaryAction.beschreibung}</p>
                    <div className="household-action-footer">
                      <span className="mono-label">Aufwand: {aufwandLabel(primaryAction.aufwand)}</span>
                      <Link className="text-link" href="/massnahmen">
                        Maßnahme einordnen
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
              <p className="household-check-boundary">{result.boundary}</p>

              {hasResultDetails ? (
                <details className="household-result-details">
                  <summary>Weitere Treffer anzeigen</summary>
                  <div className="household-detail-stack">
                    {result.secondaryRelevant.length > 0 ? (
                      <section className="household-result-block">
                        <span className="chain-label">Weitere relevante Lagekarten</span>
                        {result.secondaryRelevant.map((chain) => (
                          <article key={chain.signal.id} className="household-mini-card">
                            <strong>{chain.signal.titel}</strong>
                            <p>{bereichLabel(chain.signal.bereich)} · {chain.signal.beschreibung}</p>
                          </article>
                        ))}
                      </section>
                    ) : null}

                    {result.secondaryCostOrSupply.length > 0 ? (
                      <section className="household-result-block">
                        <span className="chain-label">Kosten / Versorgung beobachten</span>
                        {result.secondaryCostOrSupply.map((chain) => (
                          <article key={`${chain.signal.id}-impact`} className="household-mini-card">
                            <strong>{chain.impact?.titel ?? "Auswirkung in Prüfung"}</strong>
                            <p>{chain.impact?.beschreibung ?? "Noch keine konkrete Haushaltsauswirkung veröffentlicht."}</p>
                          </article>
                        ))}
                      </section>
                    ) : null}

                    {result.indirectAreas.length > 0 ? (
                      <section className="household-result-block">
                        <span className="chain-label">Eher indirekt betroffen</span>
                        <p>{result.indirectAreas.map((area) => bereichLabel(area)).join(", ")}</p>
                      </section>
                    ) : null}
                  </div>
                </details>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
