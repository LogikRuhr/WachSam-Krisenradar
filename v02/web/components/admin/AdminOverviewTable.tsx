import Link from "next/link";
import type { EditorialOverviewRow } from "@/lib/admin/editorial-read";

const statusLabels = {
  draft: "Entwurf",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
  published: "Publiziert",
};

export function AdminOverviewTable({ rows }: { rows: EditorialOverviewRow[] }) {
  return (
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
  );
}
