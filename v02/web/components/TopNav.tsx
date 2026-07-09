import Link from "next/link";
import { ModusSwitcher } from "@/components/ModusSwitcher";
import { PathTabs } from "@/components/PathTabs";
import { WerkzeugeDrawer } from "@/components/WerkzeugeDrawer";
import { auth, isAuthRuntimeConfigured, signOut } from "@/lib/auth";
import { getCurrentUserModus } from "@/lib/use-user-modus";

export async function TopNav() {
  const session = isAuthRuntimeConfigured() ? await auth() : null;
  const isSignedIn = !!session?.user;
  const currentModus = isSignedIn ? await getCurrentUserModus() : null;

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
        <PathTabs />
      </nav>
      <div className="nav-tools">
        <ModusSwitcher initialModus={currentModus} isSignedIn={isSignedIn} />
        <WerkzeugeDrawer />
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
