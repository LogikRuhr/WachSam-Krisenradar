export type AuthOnboardingIntent = "login" | "register";

export type AuthPageCopy = {
  anchor: string;
  label: string;
  title: string;
  lead: string;
  emailHelp: string;
  submitLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  privacyNote?: string;
  sideBlocks?: Array<{ label: string; title: string; text: string }>;
};

export type AuthErrorKind = "verification" | "access-denied" | "configuration" | "default";

export type AuthErrorCopy = {
  kind: AuthErrorKind;
  title: string;
  lead: string;
  actionLabel: string;
};

const REDIRECTS: Record<AuthOnboardingIntent, string> = {
  login: "/profil",
  register: "/profil?welcome=1",
};

const AUTH_PAGE_COPY: Record<AuthOnboardingIntent, AuthPageCopy> = {
  login: {
    anchor: "WachSam · Anmeldung",
    label: "Bereich: Anmeldung",
    title: "Anmelden",
    lead: "Bestehendes Konto? Wir senden dir einen Magic-Link und öffnen danach deinen persönlichen Bereich.",
    emailHelp: "E-Mail-Adresse für den Magic-Link. Wir zeigen nicht an, ob dazu bereits ein Konto besteht.",
    submitLabel: "Magic-Link senden",
    secondaryHref: "/register",
    secondaryLabel: "Noch kein Konto · Konto anlegen",
  },
  register: {
    anchor: "WachSam · Konto",
    label: "Bereich: Registrierung",
    title: "Konto anlegen",
    lead: "Du erhältst einen Magic-Link per Mail. Danach startest du direkt im Profil-Onboarding.",
    emailHelp: "E-Mail-Adresse für Anmeldung und Kontozugriff. Keine Passwörter, keine Werbeprofile.",
    submitLabel: "Konto-Link senden",
    secondaryHref: "/login",
    secondaryLabel: "Bereits ein Konto · Anmelden",
    privacyNote:
      "Wir speichern die E-Mail-Adresse ausschließlich für die Anmeldung. Profilangaben bleiben auf Modus und Heizart begrenzt; Feedback speichert keine Kontaktadresse.",
    sideBlocks: [
      {
        label: "01 · Login",
        title: "Passwortlos",
        text: "Magic-Link statt Passwort reduziert gespeicherte Geheimnisse und bleibt fuer kurze Nutzung schnell.",
      },
      {
        label: "02 · Haushalt",
        title: "Profil zuerst",
        text: "Nach dem ersten Login führt WachSam dich in den Profilbereich für Modus und Heizart.",
      },
      {
        label: "03 · Kontrolle",
        title: "Datensparsam",
        text: "Kein Tracking, keine Ads, keine zusätzliche Kontaktadresse außerhalb der Auth-E-Mail.",
      },
    ],
  },
};

const ERROR_COPY: Record<AuthErrorKind, AuthErrorCopy> = {
  verification: {
    kind: "verification",
    title: "Link konnte nicht geprüft werden",
    lead: "Der Magic-Link ist abgelaufen oder wurde bereits genutzt. Fordere bitte eine neue Mail an.",
    actionLabel: "Neue Mail anfordern",
  },
  "access-denied": {
    kind: "access-denied",
    title: "Zugriff nicht möglich",
    lead: "Der Zugriff wurde nicht freigegeben. Fordere bitte einen neuen Magic-Link an.",
    actionLabel: "Neue Mail anfordern",
  },
  configuration: {
    kind: "configuration",
    title: "Anmeldung vorübergehend nicht verfügbar",
    lead: "Der Login-Dienst ist vorübergehend nicht vollständig konfiguriert. Bitte später erneut versuchen.",
    actionLabel: "Zur Anmeldung",
  },
  default: {
    kind: "default",
    title: "Anmeldung fehlgeschlagen",
    lead: "Die Anmeldung konnte nicht abgeschlossen werden. Fordere bitte eine neue Mail an.",
    actionLabel: "Neue Mail anfordern",
  },
};

export function authRedirectForIntent(intent: AuthOnboardingIntent): string {
  return REDIRECTS[intent];
}

export function getAuthPageCopy(intent: AuthOnboardingIntent): AuthPageCopy {
  return AUTH_PAGE_COPY[intent];
}

export function getVerifyRequestCopy() {
  return {
    title: "Mail ist verschickt",
    lead:
      "Falls die Adresse genutzt werden kann, kommt gleich ein Magic-Link. Der Link gilt kurz und kann nur einmal genutzt werden.",
    actionLabel: "Zur Startseite",
  };
}

function normalizeAuthError(error: string | null | undefined): AuthErrorKind {
  switch (error) {
    case "Verification":
      return "verification";
    case "AccessDenied":
      return "access-denied";
    case "Configuration":
      return "configuration";
    default:
      return "default";
  }
}

export function getAuthErrorCopy(error: string | null | undefined): AuthErrorCopy {
  return ERROR_COPY[normalizeAuthError(error)];
}
