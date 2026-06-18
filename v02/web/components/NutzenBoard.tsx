import { modusLead } from "@/lib/personalization";
import type { HouseholdModus } from "@/lib/profile";

/** Vier Haushalts-Personas (= bestehende Modi). Nutzen-Satz aus modusLead, damit
 * Persona-Board und personalisierte Notizen dieselbe Quelle nutzen und nicht
 * auseinanderdriften. */
const PERSONAS: { modus: HouseholdModus; label: string }[] = [
  { modus: "single", label: "Single" },
  { modus: "familie", label: "Familie" },
  { modus: "selbststaendig", label: "Selbstständige" },
  { modus: "rentner", label: "Rentner:innen" },
];

/**
 * User-Story-Block: macht in einem Satz pro Haushalt sichtbar, wem WachSam wobei
 * hilft — plus eine ehrliche Scope-Abgrenzung („wofür nicht"). Hebt das aktive
 * Profil hervor, wenn ein Modus gesetzt ist. Reine Anzeige, keine neuen Daten.
 */
export function NutzenBoard({ activeModus }: { activeModus?: HouseholdModus | null }) {
  return (
    <section className="nutzen-board" aria-labelledby="nutzen-heading">
      <div className="home-section-head">
        <p className="mono-label">Wem WachSam hilft</p>
        <h2 id="nutzen-heading" className="focus-title">Ein Satz pro Haushalt</h2>
        <p>
          WachSam übersetzt globale Entwicklungen in das, was sie konkret für deinen Haushalt
          bedeuten — eingeordnet nach Deutschland-Relevanz, mit Quellenstand und ohne Alarmismus.
        </p>
      </div>
      <ul className="nutzen-list" role="list">
        {PERSONAS.map((persona) => {
          const active = activeModus === persona.modus;
          return (
            <li key={persona.modus} className={`nutzen-card${active ? " nutzen-card-active" : ""}`}>
              <p className="mono-label nutzen-persona">
                {persona.label}
                {active ? " · dein Profil" : ""}
              </p>
              <p className="nutzen-value">{modusLead(persona.modus)}</p>
            </li>
          );
        })}
      </ul>
      <p className="nutzen-scope mono-label">
        Wofür WachSam nicht da ist: keine sicheren Vorhersagen, kein Ersatz für
        Behördeninformationen oder rechtliche, medizinische und finanzielle Beratung.
      </p>
    </section>
  );
}
