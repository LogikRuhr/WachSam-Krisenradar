import Link from "next/link";
import { assertAuthRuntimeReady, signIn } from "@/lib/auth";
import { authRedirectForIntent, getAuthPageCopy } from "@/lib/auth-onboarding";

async function sendMagicLink(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  assertAuthRuntimeReady();
  await signIn("resend", { email, redirectTo: authRedirectForIntent("login") });
}

export default function LoginPage() {
  const copy = getAuthPageCopy("login");

  return (
    <main className="page-shell auth-shell auth-shell-compact">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="strich" />
        <p className="mono-label auth-anchor">{copy.anchor}</p>
        <p className="mono-label">{copy.label}</p>
        <h1 id="login-title" className="bebas-title auth-title">
          {copy.title}
        </h1>
        <p className="lead">{copy.lead}</p>

        <form action={sendMagicLink} className="auth-form">
          <label className="auth-label" htmlFor="email">
            E-Mail Adresse
          </label>
          <p id="email-help" className="admin-help">
            {copy.emailHelp}
          </p>
          <input
            className="input-mono"
            id="email"
            name="email"
            type="email"
            placeholder="name@beispiel.de"
            autoComplete="email"
            aria-describedby="email-help"
            required
          />
          <button className="btn-primary" type="submit">
            {copy.submitLabel}
          </button>
        </form>

        <div className="auth-secondary">
          <Link className="cross-link" href={copy.secondaryHref}>
            {copy.secondaryLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
