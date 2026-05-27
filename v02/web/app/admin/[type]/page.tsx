import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminItemsTable } from "@/components/admin/AdminItemsTable";
import { getTypeMeta, listEditorialItems, parseEditorialType } from "@/lib/admin/editorial-read";

export default async function AdminTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type: typeParam } = await params;
  const itemType = parseEditorialType(typeParam);
  if (!itemType) notFound();

  const meta = getTypeMeta(itemType);
  const items = await listEditorialItems(itemType);

  return (
    <section>
      <Link className="detail-back" href="/admin">← Zurück zur Übersicht</Link>
      <header className="section-header">
        <div className="strich" aria-hidden="true" />
        <p className="mono-label">Datentyp {meta.type}</p>
        <h1 className="focus-title">{meta.label}</h1>
        <p className="lead">{meta.description}</p>
      </header>
      <div className="admin-toolbar">
        <Link className="admin-link" href={`/admin/${meta.type}/new`}>Neuen Draft anlegen</Link>
        {meta.publicPath ? <Link className="admin-link secondary" href={meta.publicPath}>Public Route öffnen</Link> : null}
      </div>
      <AdminItemsTable meta={meta} items={items} />
    </section>
  );
}
