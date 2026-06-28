export type OnboardingStepStatus = "done" | "active" | "open" | "blocked";

export type OnboardingStep = {
  id: string;
  title: string;
  text: string;
  status: OnboardingStepStatus;
  href?: string;
  actionLabel?: string;
};

export type OnboardingSummary = {
  completed: number;
  total: number;
  label: string;
};

export function onboardingSummary(steps: OnboardingStep[]): OnboardingSummary {
  const completed = steps.filter((step) => step.status === "done").length;
  return { completed, total: steps.length, label: `${completed}/${steps.length} bereit` };
}

export function buildPublicOnboardingSteps(input: {
  hasProfileInput: boolean;
  connected: boolean;
  hasPublishedSignals: boolean;
  hasResult: boolean;
  hasNextStep: boolean;
}): OnboardingStep[] {
  const resultAvailable = input.connected && input.hasPublishedSignals;
  const hasUsefulResult = input.hasProfileInput && input.hasResult;

  return [
    {
      id: "household-input",
      title: "Haushalt einordnen",
      text: "Haushaltstyp und Heizart reichen fuer den ersten Abgleich. PLZ bleibt optional.",
      status: input.hasProfileInput ? "done" : "active",
    },
    {
      id: "household-impact",
      title: "Wirkung verstehen",
      text: resultAvailable
        ? "WachSam sortiert veroeffentlichte Lagekarten nach Haushaltswirkung."
        : "WachSam zeigt keine erfundenen Treffer, wenn Daten fehlen oder blockiert sind.",
      status: resultAvailable ? (hasUsefulResult ? "done" : "open") : "blocked",
    },
    {
      id: "next-step",
      title: "Prüfschritt mitnehmen",
      text: "Der nächste ruhige Schritt bleibt Orientierung und keine individuelle Beratung.",
      status: input.hasNextStep && input.hasProfileInput ? "active" : resultAvailable ? "open" : "blocked",
      href: "/massnahmen",
      actionLabel: "Maßnahmen ansehen",
    },
  ];
}

export function buildProfileOnboardingSteps(input: {
  profileFieldsFilled: number;
  profileFieldsTotal: number;
  hasRelevantSignals: boolean;
  hasActions: boolean;
  hasCheckSteps: boolean;
}): OnboardingStep[] {
  const profileComplete =
    input.profileFieldsTotal > 0 && input.profileFieldsFilled >= input.profileFieldsTotal;

  return [
    {
      id: "profile-complete",
      title: "Profil vervollständigen",
      text: "Modus, PLZ und Heizart steuern nur die Sortierung im persönlichen Bereich.",
      status: profileComplete ? "done" : "active",
      href: "#profil-bearbeiten",
      actionLabel: "Profil bearbeiten",
    },
    {
      id: "read-personal-lage",
      title: "Eigene Lage lesen",
      text: "Die wichtigsten Lagekarten stehen nach Haushaltsrelevanz sortiert oben.",
      status: profileComplete ? (input.hasRelevantSignals ? "done" : "blocked") : "open",
      href: "#relevanz-title",
      actionLabel: "Lage lesen",
    },
    {
      id: "choose-action",
      title: "Maßnahme wählen",
      text: "Einfache Prüfschritte kommen vor aufwendigeren Maßnahmen.",
      status: profileComplete ? (input.hasActions ? "active" : "blocked") : "open",
      href: "#schritte-title",
      actionLabel: "Maßnahmen prüfen",
    },
    {
      id: "use-checklist",
      title: "Prüfliste nutzen",
      text: "Die Checkliste bleibt ruhig, wiederholbar und ohne Beratungsclaim.",
      status: profileComplete ? (input.hasCheckSteps ? "active" : "blocked") : "open",
      href: "#checkliste-title",
      actionLabel: "Checkliste öffnen",
    },
  ];
}
