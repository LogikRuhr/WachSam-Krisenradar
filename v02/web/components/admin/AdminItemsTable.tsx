import Link from "next/link";
import {
  approveEditorialItem,
  publishEditorialItem,
  rejectEditorialItem,
  unpublishEditorialItem,
} from "@/app/admin/actions";
import type { EditorialListItem, EditorialTypeMeta } from "@/lib/admin/editorial-read";
import type { EditorialStatus } from "@/lib/admin/audit-log";

const statusLabels: Record<EditorialStatus, string> = {
  draft: "Entwurf",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
  published: "Publiziert",
};

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function nextStepLabel(status: EditorialStatus) {
  if (status === "draft") return "Prüfen: freigeben oder ablehnen";
  if (status === "approved") return "Publizieren oder ablehnen";
  if (status === "rejected") return "Bearbeiten und neu prüfen";
  return "Öffentlich sichtbar";
}

function TransitionForm({
  id,
  label,
  action,
  itemType,
  needsReason = false,
}: {
  id: string;
  label: string;
  action: (formData: FormData) => void | Promise<void>;
  itemType: string;
  needsReason?: boolean;
}) {
  return (
    <form action={action} className={needsReason ? "admin-inline-form admin-reject-form" : "admin-inline-form"}>
      <input type="hidden" name="id" value={id} />
      {needsReason ? (
        <input className="admin-input admin-input-small" name="reason" minLength={3} maxLength={1000} required placeholder="Ablehnungsgrund" />
      ) : null}
      <button className="admin-small-button" type="submit" aria-label={`${label} ${itemType} ${id}`}>
        {label}
      </button>
    </form>
  );
}

function RowActions({ meta, item }: { meta: EditorialTypeMeta; item: EditorialListItem }) {
  const approve = approveEditorialItem.bind(null, meta.type);
  const reject = rejectEditorialItem.bind(null, meta.type);
  const publish = publishEditorialItem.bind(null, meta.type);
  const unpublish = unpublishEditorialItem.bind(null, meta.type);

  return (
    <div className="admin-actions">
      {(item.status === "draft" || item.status === "rejected") ? (
        <Link className="admin-small-link" href={`/admin/${meta.type}/${item.id}`}>Bearbeiten</Link>
      ) : null}
      {item.status === "draft" ? (
        <>
          <TransitionForm id={item.id} label="Freigeben" action={approve} itemType={meta.label} />
          <TransitionForm id={item.id} label="Ablehnen" action={reject} itemType={meta.label} needsReason />
        </>
      ) : null}
      {item.status === "approved" ? (
        <>
          {meta.type === "nationalState" ? (
            <Link className="admin-small-link" href={`/review/${meta.type}/${item.id}`}>In Review veröffentlichen</Link>
          ) : (
            <TransitionForm id={item.id} label="Publizieren" action={publish} itemType={meta.label} />
          )}
          <TransitionForm id={item.id} label="Ablehnen" action={reject} itemType={meta.label} needsReason />
        </>
      ) : null}
      {item.status === "published" ? <TransitionForm id={item.id} label="Zurückziehen" action={unpublish} itemType={meta.label} /> : null}
    </div>
  );
}

export function AdminItemsTable({ meta, items }: { meta: EditorialTypeMeta; items: EditorialListItem[] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Titel / Label / ID</th>
            <th>Status</th>
            <th>Nächster Schritt</th>
            <th>Zuletzt geprüft</th>
            <th>Publiziert</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td data-label="Titel / Label / ID"><strong>{item.title}</strong><br /><code>{item.id}</code></td>
              <td data-label="Status"><span className={`admin-status admin-status-${item.status}`}>{statusLabels[item.status]}</span></td>
              <td data-label="Nächster Schritt">{nextStepLabel(item.status)}</td>
              <td data-label="Zuletzt geprüft">{formatDate(item.editorialReviewedAt)}</td>
              <td data-label="Publiziert">{formatDate(item.publishedAt)}</td>
              <td data-label="Aktionen"><RowActions meta={meta} item={item} /></td>
            </tr>
          ))}
          {items.length === 0 ? (
            <tr>
              <td colSpan={6}>Keine Einträge vorhanden.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
