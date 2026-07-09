import Link from "next/link";
import { withEditorRedirect } from "@/lib/admin/redirect";
import { listFeedback } from "@/lib/admin/feedback-read";
import { FEEDBACK_CATEGORY_LABEL, type FeedbackCategory } from "@/lib/feedback";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function AdminFeedbackPage() {
  const rows = await withEditorRedirect(() => listFeedback(200));

  return (
    <section>
      <Link className="detail-back" href="/admin">← Zurück zur Übersicht</Link>
      <header className="section-header">
        <div className="strich" aria-hidden="true" />
        <p className="mono-label">Nutzer-Feedback</p>
        <h1 className="focus-title">Feedback-Eingang</h1>
        <p className="lead">
          In-App-Feedback der Besucher:innen, neueste zuerst. Anonyme Einträge ohne Nutzer-ID.
        </p>
      </header>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Zeitpunkt</th>
              <th>Kategorie</th>
              <th>Bewertung</th>
              <th>Nachricht</th>
              <th>Seite</th>
              <th>Nutzer-ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td data-label="Zeitpunkt">{formatDate(row.createdAt)}</td>
                <td data-label="Kategorie">
                  {FEEDBACK_CATEGORY_LABEL[row.category as FeedbackCategory] ?? row.category}
                </td>
                <td data-label="Bewertung">{row.rating ?? "—"}</td>
                <td data-label="Nachricht">{row.message}</td>
                <td data-label="Seite">
                  <code>{row.pagePath ?? "—"}</code>
                </td>
                <td data-label="Nutzer-ID">
                  <code>{row.userId ?? "anonym"}</code>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>Noch kein Feedback eingegangen.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
