import { Fragment } from "react";
import Link from "next/link";
import type { ProfileCompleteness } from "@/lib/personalization";

/**
 * Ruhige Anzeige der Profil-Vollständigkeit. Erklärt, was gesetzt ist und was
 * noch offen ist — ohne Druck, ohne Alarm. Nutzt vorhandene Felder.
 */
export function ProfileStatus({ completeness }: { completeness: ProfileCompleteness }) {
  const { filled, total, fields } = completeness;
  const complete = filled === total;

  return (
    <section className="detail-aside-box" aria-labelledby="profilstatus-title">
      <p className="mono-label">Profilstatus</p>
      <h2 id="profilstatus-title" className="detail-title-small">{filled} von {total} Angaben gesetzt</h2>
      <p>
        {complete
          ? "Dein Profil ist vollständig — WachSam kann Hinweise gut auf deinen Haushalt zuschneiden."
          : "Je vollständiger dein Profil, desto genauer die persönlichen Hinweise. Fehlende Angaben sind kein Problem und jederzeit ergänzbar."}
      </p>
      <dl className="detail-dl">
        {fields.map((field) => (
          <Fragment key={field.key}>
            <dt>{field.label}</dt>
            <dd>{field.set ? "gesetzt" : "noch offen"}</dd>
          </Fragment>
        ))}
      </dl>
      {!complete ? (
        <Link className="text-link" href="#profil-bearbeiten">Profil ergänzen</Link>
      ) : null}
    </section>
  );
}
