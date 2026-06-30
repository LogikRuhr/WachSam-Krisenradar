import Link from "next/link";
import { approveEditorialItem, publishEditorialItem } from "@/app/admin/actions";
import type { EditorialOverviewRow, EditorialReviewQueueItem } from "@/lib/admin/editorial-read";

const statusLabels = {
  draft: "Entwurf",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
  published: "Publiziert",
};

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function QueueDecisionForm({ item }: { item: EditorialReviewQueueItem }) {
  const isDraft = item.status === "draft";
  const action = (isDraft ? approveEditorialItem : publishEditorialItem).bind(null, item.type);
  const label = isDraft ? "Freigeben" : "Publizieren";

  return (
    <form action={action} className="admin-inline-form">
      <input type="hidden" name="id" value={item.id} />
      <button className="admin-small-button" type="submit" aria-label={`${label} ${item.label} ${item.id}`}>
        {label}
      </button>
    </form>
  );
}

function AdminReviewQueue({ queue }: { queue: EditorialReviewQueueItem[] }) {
  return (
    <section className="admin-review-queue" aria-labelledby="admin-review-queue-title">
      <div>
        <p className="mono-label">Review Queue</p>
        <h2 id="admin-review-queue-title" className="detail-title-small">Nächste redaktionelle Entscheidungen</h2>
        <p>Neue Intelligence-Drafts bleiben intern, bis sie freigegeben und danach publiziert werden.</p>
      </div>
      {queue.length > 0 ? (
        <ol className="admin-review-list">
          {queue.map((item) => (
            <li key={`${item.type}:${item.id}`}>
              <div>
                <span className={`admin-status admin-status-${item.status}`}>{statusLabels[item.status]}</span>
                <strong>{item.title}</strong>
                <small>
                  {item.label} · Eingang {formatDate(item.queuedAt)} · <code>{item.id}</code>
                </small>
              </div>
              <div className="admin-review-actions">
                <Link className="admin-small-link" href={`/admin/${item.type}/${item.id}`}>Details</Link>
                <QueueDecisionForm item={item} />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="admin-review-empty">Keine Entwürfe oder Freigaben in der Queue.</p>
      )}
    </section>
  );
}

export function AdminOverviewTable({ rows, queue }: { rows: EditorialOverviewRow[]; queue: EditorialReviewQueueItem[] }) {
  return (
    <>
      <AdminReviewQueue queue={queue} />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Datentyp</th>
              <th>Beschreibung</th>
              <th>Entwurf</th>
              <th>Freigegeben</th>
              <th>Abgelehnt</th>
              <th>Publiziert</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.type}>
                <td data-label="Datentyp"><strong>{row.label}</strong><br /><code>{row.type}</code></td>
                <td data-label="Beschreibung">{row.description}</td>
                {Object.entries(statusLabels).map(([status, label]) => (
                  <td key={status} data-label={label} className="admin-count">
                    {row.counts[status as keyof typeof row.counts]}
                  </td>
                ))}
                <td data-label="Aktion">
                  <Link className="admin-link" href={`/admin/${row.type}`}>Öffnen</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
