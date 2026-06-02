import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getHouseholdByUserId, upsertHouseholdAction } from "@/lib/profile";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProfilPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const household = await getHouseholdByUserId(userId);

  return (
    <main className="page-shell auth-shell auth-shell-compact">
      <section className="auth-card" aria-labelledby="profil-title">
        <div className="strich" />
        <p className="mono-label auth-anchor">WachSam · Haushalt</p>
        <p className="mono-label">Bereich: Profil</p>
        <h1 id="profil-title" className="bebas-title auth-title">
          Profil
        </h1>
        <p className="lead">Lege im Member-Bereich fest, aus welcher Haushaltsperspektive WachSam Hinweise einordnet.</p>
        <div className="profile-scope-note">
          <p>
            Diese Angaben bleiben aus der öffentlichen Navigation heraus. Sie steuern nur, wie Lage, Kosten, Versorgung und Maßnahmen für deinen Alltag sortiert werden.
          </p>
        </div>

        <ProfileForm
          action={upsertHouseholdAction}
          defaultModus={household?.modus ?? "familie"}
          defaultPlz={household?.plz ?? ""}
          defaultHeizart={household?.heizart ?? "unbekannt"}
        />
      </section>
    </main>
  );
}
