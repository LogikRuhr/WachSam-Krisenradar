"use client";

import { useState, useTransition } from "react";

type PasskeyRemovalProps = {
  removeAction: () => Promise<void>;
};

export function PasskeyRemoval({ removeAction }: PasskeyRemovalProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function removePasskeys() {
    if (!window.confirm("Alle WachSam-Passkeys dieses Kontos entfernen? Der Magic Link bleibt als Zugang erhalten.")) {
      return;
    }

    startTransition(async () => {
      try {
        await removeAction();
        setStatus("Passkeys wurden entfernt. Der Magic Link bleibt als Zugang erhalten.");
      } catch {
        setStatus("Passkeys konnten nicht entfernt werden. Bitte erneut anmelden und versuchen.");
      }
    });
  }

  return (
    <div className="auth-form">
      <button className="btn-rost" type="button" onClick={removePasskeys} disabled={isPending}>
        {isPending ? "Passkeys werden entfernt …" : "Passkeys entfernen"}
      </button>
      {status ? <p className="lead" role="status">{status}</p> : null}
    </div>
  );
}
