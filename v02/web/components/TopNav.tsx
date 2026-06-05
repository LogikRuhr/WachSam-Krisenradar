import Link from "next/link";
import { auth, isAuthRuntimeConfigured, signOut } from "@/lib/auth";

const tabs = [
  ["/lagebild", "Lage"],
  ["/kosten", "Haushalt"],
  ["/kaskaden", "Wirkungsketten"],
  ["/massnahmen", "Maßnahmen"],
  ["/quellen", "Quellen"],
];

export async function TopNav() {
  const session = isAuthRuntimeConfigured() ? await auth() : null;
  const isSignedIn = !!session?.user;

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="top-nav">
      <Link href="/" className="logo" aria-label="WachSam Startseite">
        Wach<span>Sam</span>
      </Link>
      <nav className="path-tabs" aria-label="WachSam Hauptnavigation">
        {tabs.map(([href, label]) => (
          <Link className="path-tab hover-rost" href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="nav-tools">
        {isSignedIn ? (
          <div className="auth-chip">
            <Link href="/profil">Mein Bereich</Link>
            <form action={logoutAction}>
              <button type="submit">Abmelden</button>
            </form>
          </div>
        ) : (
          <Link className="auth-chip auth-chip-link" href="/login">
            Anmelden
          </Link>
        )}
      </div>
    </header>
  );
}
