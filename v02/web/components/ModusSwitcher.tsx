"use client";

import { useEffect, useState, useTransition } from "react";
import { updateHouseholdModusAction, type HouseholdModus } from "@/lib/profile";

const modi: Array<{ value: HouseholdModus; label: string }> = [
  { value: "single", label: "Single" },
  { value: "familie", label: "Familie" },
  { value: "selbststaendig", label: "Selbstständig" },
  { value: "rentner", label: "Rentebeziehende" },
];

type ModusSwitcherProps = {
  initialModus: HouseholdModus | null;
  isSignedIn: boolean;
};

export function ModusSwitcher({ initialModus, isSignedIn }: ModusSwitcherProps) {
  const [modus, setModus] = useState<HouseholdModus | null>(initialModus);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setModus(isSignedIn ? initialModus : null);
  }, [initialModus, isSignedIn]);

  function choose(value: HouseholdModus) {
    if (!isSignedIn) return;
    const previousModus = modus;
    setModus(value);

    startTransition(async () => {
      try {
        const result = await updateHouseholdModusAction(value);
        if (!result.ok) setModus(previousModus);
      } catch (error) {
        setModus(previousModus);
        console.error("Modus konnte nicht gespeichert werden.", error);
      }
    });
  }

  if (!isSignedIn) return null;

  return (
    <div className="modus-switcher" aria-label="Haushaltsmodus" aria-busy={isPending}>
      <span className="modus-label">Modus</span>
      {modi.map((item) => (
        <button
          className={item.value === modus ? "modus-chip active" : "modus-chip"}
          key={item.value}
          onClick={() => choose(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
