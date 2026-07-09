import Link from "next/link";
import { getVerifyRequestCopy } from "@/lib/auth-onboarding";

export default function VerifyRequestPage() {
  const copy = getVerifyRequestCopy();

  return (
    <main className="page-shell auth-shell auth-shell-compact">
      <section className="auth-card" aria-labelledby="verify-title">
        <div className="strich" />
        <p className="mono-label">Magic-Link</p>
        <h1 id="verify-title" className="bebas-title auth-title">
          {copy.title}
        </h1>
        <p className="lead">{copy.lead}</p>
        <Link className="btn-primary auth-inline-button" href="/">
          {copy.actionLabel}
        </Link>
      </section>
    </main>
  );
}
