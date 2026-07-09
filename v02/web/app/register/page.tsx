import Link from "next/link";
import { assertAuthRuntimeReady, signIn } from "@/lib/auth";
import { authRedirectForIntent, getAuthPageCopy } from "@/lib/auth-onboarding";

async function sendMagicLink(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  assertAuthRuntimeReady();
  await signIn("resend", { email, redirectTo: authRedirectForIntent("register") });
}

export default function RegisterPage() {
  const copy = getAuthPageCopy("register");

  return (
    <main className="page-shell auth-shell">
      <section className="auth-card" aria-labelledby="register-title">
        <div className="strich" />
        <p className="mono-label auth-anchor">{copy.anchor}</p>
        <p className="mono-label">{copy.label}</p>
        <h1 id="register-title" className="bebas-title auth-title">
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

        {copy.privacyNote ? <div className="dsgvo-hinweis">{copy.privacyNote}</div> : null}

        <div className="auth-secondary">
          <Link className="cross-link" href={copy.secondaryHref}>
            {copy.secondaryLabel}
          </Link>
        </div>
      </section>

      <aside className="auth-side" aria-label="Warum diese Angaben?">
        <p className="mono-label">Warum diese Angaben?</p>
        {copy.sideBlocks?.map((block) => (
          <div className="auth-side-block" key={block.label}>
            <span>{block.label}</span>
            <p><strong>{block.title}.</strong> {block.text}</p>
          </div>
        ))}
      </aside>
    </main>
  );
}
