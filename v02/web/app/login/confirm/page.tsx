import Link from "next/link";
import { redirect } from "next/navigation";

type SearchParams = Promise<{ token?: string; email?: string; callbackUrl?: string }>;

export const metadata = { title: "Anmeldung bestätigen · WachSam" };

async function confirmSignIn(formData: FormData) {
  "use server";

  const token = String(formData.get("token") ?? "");
  const email = String(formData.get("email") ?? "");
  const callbackUrl = formData.get("callbackUrl");
  const params = new URLSearchParams({
    token,
    email,
    ...(callbackUrl ? { callbackUrl: String(callbackUrl) } : {}),
  });
  redirect(`/api/auth/callback/resend?${params.toString()}`);
}

export default async function LoginConfirmPage({ searchParams }: { searchParams: SearchParams }) {
  const { token, email, callbackUrl } = await searchParams;

  if (!token || !email) {
    return (
      <main className="page-shell auth-shell auth-shell-compact">
        <section className="auth-card" aria-labelledby="confirm-title">
          <div className="strich" />
          <p className="mono-label">Magic-Link</p>
          <h1 id="confirm-title" className="bebas-title auth-title">
            Link ungültig
          </h1>
          <p className="lead">
            Dieser Link enthält keine gültigen Anmeldedaten. Fordere bitte eine neue Anmelde-Mail an.
          </p>
          <Link className="btn-primary auth-inline-button" href="/login">
            Neu anmelden
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell auth-shell auth-shell-compact">
      <section className="auth-card" aria-labelledby="confirm-title">
        <div className="strich" />
        <p className="mono-label">Magic-Link</p>
        <h1 id="confirm-title" className="bebas-title auth-title">
          Anmeldung bestätigen
        </h1>
        <p className="lead">Fast geschafft. Bestätige die Anmeldung für {email}.</p>

        <form action={confirmSignIn} className="auth-form">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="email" value={email} />
          {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
          <button className="btn-primary" type="submit">
            Anmeldung bestätigen
          </button>
        </form>
      </section>
    </main>
  );
}
