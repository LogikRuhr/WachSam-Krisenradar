import type { EditorialAuditEventRow } from "@/lib/admin/editorial-read";

const actionLabels: Record<string, string> = {
  create: "Erstellt",
  update: "Aktualisiert",
  approve: "Freigegeben",
  reject: "Abgelehnt",
  publish: "Publiziert",
  unpublish: "Zurückgezogen",
};

const statusLabels: Record<string, string> = {
  draft: "Entwurf",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
  published: "Publiziert",
};

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
            <th>Aktion</th>
            <th>von Status</th>
            <th>zu Status</th>
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
              <td data-label="Aktion">{actionLabels[event.action] ?? event.action}</td>
              <td data-label="von Status">{event.fromStatus ? statusLabels[event.fromStatus] : "—"}</td>
              <td data-label="zu Status">{event.toStatus ? statusLabels[event.toStatus] : "—"}</td>
              <td data-label="Nutzer-ID"><code>{event.actorId ?? "—"}</code></td>
              <td data-label="Grund">{event.reason ?? "—"}</td>
            </tr>
          ))}
          {events.length === 0 ? (
            <tr>
              <td colSpan={8}>Noch keine Audit-Events vorhanden.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
