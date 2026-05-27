import Link from "next/link";
import { assertAuthRuntimeReady, signIn } from "@/lib/auth";

async function sendMagicLink(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  assertAuthRuntimeReady();
  await signIn("resend", { email, redirectTo: "/" });
}

export default function LoginPage() {
  return (
    <main className="page-shell auth-shell auth-shell-compact">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="strich" />
        <p className="mono-label auth-anchor">WachSam · Anmeldung</p>
        <p className="mono-label">Bereich: Anmeldung</p>
        <h1 id="login-title" className="bebas-title auth-title">
          Anmelden
        </h1>
        <p className="lead">Bestehendes Konto? Magic-Link senden.</p>

        <form action={sendMagicLink} className="auth-form">
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
            Magic-Link senden
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
