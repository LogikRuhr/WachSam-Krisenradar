import Link from "next/link";
import { AdminAuditTable } from "@/components/admin/AdminAuditTable";
import { listAuditEvents } from "@/lib/admin/editorial-read";
import { withEditorRedirect } from "@/lib/admin/redirect";

export default async function AdminAuditPage() {
  const events = await withEditorRedirect(() => listAuditEvents(150));

  return (
    <section>
      <Link className="detail-back" href="/admin">← Zurück zur Übersicht</Link>
      <header className="section-header">
        <div className="strich" aria-hidden="true" />
        <p className="mono-label">Editorial Audit</p>
        <h1 className="focus-title">Audit-Log</h1>
        <p className="lead">Letzte redaktionelle Create-, Update- und Status-Transitions. Actor wird als technische User-ID angezeigt.</p>
      </header>
      <AdminAuditTable events={events} />
    </section>
  );
}
