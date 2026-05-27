import Link from "next/link";
import { notFound } from "next/navigation";
import { saveEditorialItem } from "@/app/admin/actions";
import { AdminEditorForm } from "@/components/admin/AdminEditorForm";
import { getTypeMeta, parseEditorialType } from "@/lib/admin/editorial-read";

export default async function AdminNewItemPage({ params }: { params: Promise<{ type: string }> }) {
  const { type: typeParam } = await params;
  const itemType = parseEditorialType(typeParam);
  if (!itemType) notFound();

  const meta = getTypeMeta(itemType);
  const action = saveEditorialItem.bind(null, itemType, "create");

  return (
    <section>
      <Link className="detail-back" href={`/admin/${meta.type}`}>← Zurück zur Liste</Link>
      <header className="section-header">
        <div className="strich" aria-hidden="true" />
        <p className="mono-label">Neuer Entwurf · {meta.label}</p>
        <h1 className="focus-title">{meta.singularLabel} anlegen</h1>
        <p className="lead">Entwurf erstellen. Review, Publikation und Ablehnung erfolgen anschließend über die Listenansicht.</p>
      </header>
      <AdminEditorForm meta={meta} item={null} mode="create" action={action} />
    </section>
  );
}
