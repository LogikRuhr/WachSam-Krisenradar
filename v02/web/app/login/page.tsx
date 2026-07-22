import Link from "next/link";
import { assertAuthRuntimeReady, signIn } from "@/lib/auth";
import { PasskeyAccess } from "@/components/auth/PasskeyAccess";

async function sendMagicLink(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const requestedCallback = String(formData.get("callbackUrl") ?? "/");
  const callbackUrl = requestedCallback.startsWith("/") && !requestedCallback.startsWith("//") ? requestedCallback : "/";
  assertAuthRuntimeReady();
  await signIn("resend", { email, redirectTo: callbackUrl });
}

type SearchParams = Promise<{ callbackUrl?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { callbackUrl: requestedCallback } = await searchParams;
  const callbackUrl = requestedCallback?.startsWith("/") && !requestedCallback.startsWith("//") ? requestedCallback : "/";

  return (
    <main className="page-shell auth-shell auth-shell-compact">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="strich" />
        <p className="mono-label auth-anchor">WachSam · Anmeldung</p>
        <p className="mono-label">Bereich: Anmeldung</p>
        <h1 id="login-title" className="bebas-title auth-title">
          Anmelden
        </h1>
        <p className="lead">Auf Android direkt mit Fingerabdruck, Gesicht oder Geraetecode anmelden.</p>

        <PasskeyAccess intent="authenticate" callbackUrl={callbackUrl} />

        <p className="mono-label">Falls dein Passkey nicht verfuegbar ist</p>

        <form action={sendMagicLink} className="auth-form">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <label className="auth-label" htmlFor="email">
            E-Mail Adresse
          </label>
          <input
            className="input-mono"
            id="email"
            name="email"
            type="email"
            placeholder="name@beispiel.de"
            autoComplete="email"
            required
          />
          <button className="btn-primary" type="submit">
            Magic-Link als Rueckweg senden
          </button>
        </form>

        <div className="auth-secondary">
          <Link className="cross-link" href="/register">
            Noch kein Konto · Konto anlegen
          </Link>
        </div>
      </section>
    </main>
  );
}
