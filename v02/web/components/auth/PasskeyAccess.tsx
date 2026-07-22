"use client";

import { useEffect, useState, useTransition } from "react";
import { browserSupportsWebAuthn, startAuthentication, startRegistration } from "@simplewebauthn/browser";

type Intent = "authenticate" | "register";

type PasskeyAccessProps = {
  intent: Intent;
  callbackUrl: string;
};

type OptionsResponse = {
  action: Intent;
  options: Parameters<typeof startAuthentication>[0] | Parameters<typeof startRegistration>[0];
};

function messageFor(error: unknown) {
  if (error instanceof Error && error.name === "NotAllowedError") {
    return "Passkey-Abfrage abgebrochen. Du kannst es jederzeit erneut versuchen.";
  }
  return "Passkey konnte nicht verwendet werden. Nutze bei Bedarf den Magic Link.";
}

async function getCsrfToken() {
  const response = await fetch("/api/auth/csrf", { cache: "no-store", credentials: "same-origin" });
  const data = (await response.json()) as { csrfToken?: string };
  if (!response.ok || !data.csrfToken) {
    throw new Error("CSRF-Token nicht verfuegbar.");
  }
  return data.csrfToken;
}

function submitCallback(action: Intent, data: unknown, csrfToken: string, callbackUrl: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/auth/callback/passkey";

  for (const [name, value] of Object.entries({
    csrfToken,
    callbackUrl,
    action,
    data: JSON.stringify(data),
  })) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

export function PasskeyAccess({ intent, callbackUrl }: PasskeyAccessProps) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);

  function startPasskey() {
    startTransition(async () => {
      setStatus(null);
      try {
        const response = await fetch(`/api/auth/webauthn-options/passkey?action=${intent}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const payload = (await response.json()) as OptionsResponse;
        if (!response.ok || payload.action !== intent || !payload.options) {
          throw new Error("Passkey-Optionen nicht verfuegbar.");
        }

        const data =
          intent === "authenticate"
            ? await startAuthentication(payload.options as Parameters<typeof startAuthentication>[0])
            : await startRegistration(payload.options as Parameters<typeof startRegistration>[0]);
        const csrfToken = await getCsrfToken();
        submitCallback(intent, data, csrfToken, callbackUrl);
      } catch (error) {
        setStatus(messageFor(error));
      }
    });
  }

  if (!supported) {
    return <p className="lead">Dieser Browser unterstuetzt keine Passkeys. Nutze den Magic Link als Zugang.</p>;
  }

  const label = intent === "authenticate" ? "Mit Fingerabdruck oder Geraetecode anmelden" : "Passkey auf diesem Geraet einrichten";

  return (
    <div className="auth-form">
      <button className="btn-primary" type="button" onClick={startPasskey} disabled={isPending}>
        {isPending ? "Geraetebestaetigung wird geoeffnet …" : label}
      </button>
      {status ? <p className="lead" role="status">{status}</p> : null}
    </div>
  );
}
