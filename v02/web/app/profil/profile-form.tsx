"use client";

import { useActionState } from "react";
import type { HouseholdHeizart, HouseholdModus, ProfileActionState } from "@/lib/profile";

const modi: Array<{ value: HouseholdModus; label: string }> = [
  { value: "single", label: "Single" },
  { value: "familie", label: "Familie" },
  { value: "selbststaendig", label: "Selbstständig" },
  { value: "rentner", label: "Rentner" },
];

const heizarten: Array<{ value: HouseholdHeizart; label: string }> = [
  { value: "gas", label: "Gas" },
  { value: "oel", label: "Öl" },
  { value: "fernwaerme", label: "Fernwärme" },
  { value: "waermepumpe", label: "Wärmepumpe" },
  { value: "strom", label: "Strom (direkt)" },
  { value: "unbekannt", label: "Weiß ich nicht" },
];

type ProfileFormProps = {
  action: (previousState: ProfileActionState, formData: FormData) => Promise<ProfileActionState>;
  defaultModus: HouseholdModus;
  defaultPlz: string;
  defaultHeizart: HouseholdHeizart;
};

export function ProfileForm({ action, defaultModus, defaultPlz, defaultHeizart }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(action, { ok: false, message: null });

  return (
    <form action={formAction} className="auth-form" style={{ maxWidth: "28rem" }}>
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend className="auth-label" style={{ marginBottom: "10px" }}>
          Modus
        </legend>
        <div className="modus-switcher" role="radiogroup" aria-label="Haushaltsmodus">
          {modi.map((item) => (
            <label className="modus-chip" key={item.value}>
              <input
                type="radio"
                name="modus"
                value={item.value}
                defaultChecked={item.value === defaultModus}
                required
                style={{ marginRight: "8px" }}
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="auth-label" htmlFor="plz">
        PLZ
      </label>
      <input
        className="input-mono"
        id="plz"
        name="plz"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{5}"
        maxLength={5}
        minLength={5}
        autoComplete="postal-code"
        placeholder="12345"
        defaultValue={defaultPlz}
        required
      />

      <label className="auth-label" htmlFor="heizart">
        Heizart
      </label>
      <select className="input-mono" id="heizart" name="heizart" defaultValue={defaultHeizart}>
        {heizarten.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      {state.message ? (
        <p className="mono-label" role="status" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <button className="btn-primary" type="submit" disabled={isPending}>
        {isPending ? "Speichert..." : "Profil speichern"}
      </button>

      <div className="dsgvo-hinweis">Nur Modus, PLZ und Heizart gespeichert. Keine Verknüpfung mit Tracking oder Werbung.</div>
    </form>
  );
}
