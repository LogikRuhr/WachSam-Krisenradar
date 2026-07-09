import Link from "next/link";
import { getAuthErrorCopy } from "@/lib/auth-onboarding";

type LoginErrorPageProps = {
  searchParams?: Promise<{ error?: string | string[] }>;
};

export default async function LoginErrorPage({ searchParams }: LoginErrorPageProps) {
  const params = await searchParams;
  const error = Array.isArray(params?.error) ? params?.error[0] : params?.error;
  const copy = getAuthErrorCopy(error);

  return (
    <main className="page-shell auth-shell auth-shell-compact">
      <section className="auth-card" aria-labelledby="error-title">
        <div className="strich" />
        <p className="mono-label">Anmeldung fehlgeschlagen</p>
        <h1 id="error-title" className="bebas-title auth-title">
          {copy.title}
        </h1>
        <p className="lead">{copy.lead}</p>
        <Link className="btn-primary auth-inline-button" href="/login">
          {copy.actionLabel}
        </Link>
      </section>
    </main>
  );
}
