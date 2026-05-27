import Link from "next/link";
import { assertAuthRuntimeReady, signIn } from "@/lib/auth";

async function sendMagicLink(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  assertAuthRuntimeReady();
  await signIn("resend", { email, redirectTo: "/" });
}

export default function RegisterPage() {
  return (
    <main className="page-shell auth-shell">
      <section className="auth-card" aria-labelledby="register-title">
        <div className="strich" />
        <p className="mono-label auth-anchor">WachSam · Konto</p>
        <p className="mono-label">Bereich: Registrierung</p>
        <h1 id="register-title" className="bebas-title auth-title">
          Konto anlegen
        </h1>
        <p className="lead">Du erhältst einen Magic-Link per Mail. Klick darauf, um dich einzuloggen.</p>

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

        <div className="dsgvo-hinweis">
          Wir speichern für den Login deine E-Mail-Adresse. Keine Tracker, keine Ads.
        </div>

        <div className="auth-secondary">
          <Link className="cross-link" href="/login">
            Bereits ein Konto · Anmelden
          </Link>
        </div>
      </section>

      <aside className="auth-side" aria-label="Warum diese Angaben?">
        <p className="mono-label">Warum diese Angaben?</p>
        <div className="auth-side-block">
          <span>01 · Login</span>
          <p>Magic-Link statt Passwort: kurze Anmeldung, weniger gespeicherte Daten.</p>
        </div>
        <div className="auth-side-block">
          <span>02 · Haushalt</span>
          <p>Dein Modus hilft später bei verständlichen Haushaltswirkungen.</p>
        </div>
        <div className="auth-side-block">
          <span>03 · Kontrolle</span>
          <p>Du behältst Zugriff und kannst Angaben später ergänzen oder ändern.</p>
        </div>
      </aside>
    </main>
  );
}
