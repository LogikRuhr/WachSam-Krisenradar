import Link from "next/link";

export default function LoginErrorPage() {
  return (
    <main className="page-shell auth-shell auth-shell-compact">
      <section className="auth-card" aria-labelledby="error-title">
        <div className="strich" />
        <p className="mono-label">Anmeldung fehlgeschlagen</p>
        <h1 id="error-title" className="bebas-title auth-title">
          Link konnte nicht geprüft werden
        </h1>
        <p className="lead">
          Der Magic-Link ist abgelaufen oder wurde bereits genutzt. Fordere bitte eine neue Mail an.
        </p>
        <Link className="btn-primary auth-inline-button" href="/login">
          Neue Mail anfordern
        </Link>
      </section>
    </main>
  );
}
