import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <main className="page-shell auth-shell auth-shell-compact">
      <section className="auth-card" aria-labelledby="verify-title">
        <div className="strich" />
        <p className="mono-label">Magic-Link</p>
        <h1 id="verify-title" className="bebas-title auth-title">
          Mail ist verschickt
        </h1>
        <p className="lead">
          Mail ist verschickt. Bitte schau in dein Postfach und öffne den Link — er führt auf eine
          Bestätigungsseite, dort einmal auf „Anmeldung bestätigen“ tippen. Der Link gilt 10 Minuten.
        </p>
        <Link className="btn-primary auth-inline-button" href="/">
          Zur Startseite
        </Link>
      </section>
    </main>
  );
}
