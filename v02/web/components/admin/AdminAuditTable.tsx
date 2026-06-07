import type { EditorialAuditEventRow } from "@/lib/admin/editorial-read";
import { auditTransitionSummary } from "@/lib/editorial";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export function AdminAuditTable({ events }: { events: EditorialAuditEventRow[] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Zeitpunkt</th>
            <th>Typ</th>
            <th>Item-ID</th>
            <th>Vorgang</th>
            <th>Nutzer-ID</th>
            <th>Grund</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td data-label="Zeitpunkt">{formatDate(event.createdAt)}</td>
              <td data-label="Typ"><code>{event.itemType}</code></td>
              <td data-label="Item-ID"><code>{event.itemId}</code></td>
              <td data-label="Vorgang">{auditTransitionSummary(event)}</td>
              <td data-label="Nutzer-ID"><code>{event.actorId ?? "—"}</code></td>
              <td data-label="Grund">
                {event.reason ? (
                  <details className="audit-reason">
                    <summary>Grund</summary>
                    <p>{event.reason}</p>
                  </details>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
          {events.length === 0 ? (
            <tr>
              <td colSpan={6}>Noch keine Audit-Events vorhanden.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
