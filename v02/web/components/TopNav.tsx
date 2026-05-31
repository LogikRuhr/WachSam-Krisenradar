import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { ModusSwitcher } from "./ModusSwitcher";
import { WerkzeugeDrawer } from "./WerkzeugeDrawer";

const tabs = [
  ["/lagebild", "Lage"],
  ["/kosten", "Haushalt"],
  ["/kaskaden", "Wirkungsketten"],
  ["/massnahmen", "Maßnahmen"],
];

function shortenEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const shortLocal = local.length > 12 ? `${local.slice(0, 10)}…` : local;
  return `${shortLocal}@${domain}`;
}

export async function TopNav() {
  const session = await auth();
  const email = session?.user?.email ?? null;

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="top-nav">
      <Link href="/" className="logo" aria-label="WachSam Startseite">
        Wach<span>Sam</span>
      </Link>
      <nav className="path-tabs" aria-label="Vier WachSam Pfade">
        {tabs.map(([href, label]) => (
          <Link className="path-tab hover-rost" href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="nav-tools">
        <ModusSwitcher />
        <WerkzeugeDrawer />
        {email ? (
          <div className="auth-chip">
            <span>{shortenEmail(email)}</span>
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
