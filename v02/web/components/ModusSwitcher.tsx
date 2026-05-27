"use client";

import { useEffect, useState, useTransition } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { getCurrentHouseholdModusAction, updateHouseholdModusAction, type HouseholdModus } from "@/lib/profile";

const modi: Array<{ value: HouseholdModus; label: string }> = [
  { value: "single", label: "Single" },
  { value: "familie", label: "Familie" },
  { value: "selbststaendig", label: "Selbstständig" },
  { value: "rentner", label: "Rentner" },
];

function isHouseholdModus(value: string | null): value is HouseholdModus {
  return modi.some((item) => item.value === value);
}

function ModusSwitcherInner() {
  const { data: session, status } = useSession();
  const [modus, setModus] = useState<HouseholdModus>("familie");
  const [isPending, startTransition] = useTransition();
  const isSignedIn = status === "authenticated" && !!session?.user;

  useEffect(() => {
    if (status !== "unauthenticated") return;

    const stored = window.localStorage.getItem("wachsam-modus");
    if (isHouseholdModus(stored)) setModus(stored);
  }, [status]);

  useEffect(() => {
    if (!isSignedIn) return;

    let isActive = true;
    startTransition(async () => {
      try {
        const storedModus = await getCurrentHouseholdModusAction();
        if (isActive && storedModus) setModus(storedModus);
      } catch (error) {
        console.error("Modus konnte nicht geladen werden.", error);
      }
    });

    return () => {
      isActive = false;
    };
  }, [isSignedIn]);

  function choose(value: HouseholdModus) {
    setModus(value);

    if (!isSignedIn) {
      window.localStorage.setItem("wachsam-modus", value);
      return;
    }

    startTransition(async () => {
      try {
        await updateHouseholdModusAction(value);
      } catch (error) {
        console.error("Modus konnte nicht gespeichert werden.", error);
      }
    });
  }

  return (
    <div className="modus-switcher" aria-label="Haushaltsmodus" aria-busy={isPending}>
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

export function ModusSwitcher() {
  return (
    <SessionProvider>
      <ModusSwitcherInner />
    </SessionProvider>
  );
}
