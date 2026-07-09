import Link from "next/link";
import { notFound } from "next/navigation";
import { saveEditorialItem } from "@/app/admin/actions";
import { AdminEditorForm } from "@/components/admin/AdminEditorForm";
import { getEditorialItem, getTypeMeta, parseEditorialType } from "@/lib/admin/editorial-read";
import { withEditorRedirect } from "@/lib/admin/redirect";
import { editorialStatusExplain, editorialStatusLabel } from "@/lib/editorial";

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function AdminEditItemPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type: typeParam, id } = await params;
  const itemType = parseEditorialType(typeParam);
  if (!itemType) notFound();

  const meta = getTypeMeta(itemType);
  const item = await withEditorRedirect(() => getEditorialItem(itemType, id));
  if (!item) notFound();
  const action = saveEditorialItem.bind(null, itemType, "update");

  return (
    <section>
      <Link className="detail-back" href={`/admin/${meta.type}`}>← Zurück zur Liste</Link>
      <header className="section-header">
        <div className="strich" aria-hidden="true" />
        <p className="mono-label">{meta.label} · {editorialStatusLabel(item.editorialStatus)}</p>
        <h1 className="focus-title">{String(item[meta.titleField] ?? item.id)}</h1>
        <p className="lead">ID: <code>{item.id}</code> · geprüft: {formatDate(item.editorialReviewedAt)} · publiziert: {formatDate(item.publishedAt)}</p>
        <p className="admin-status-explain">{editorialStatusExplain(item.editorialStatus)}</p>
      </header>
      <AdminEditorForm meta={meta} item={item} mode="update" action={action} />
    </section>
  );
}
