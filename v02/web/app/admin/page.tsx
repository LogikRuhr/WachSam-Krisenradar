import Link from "next/link";
import { AdminOverviewTable } from "@/components/admin/AdminOverviewTable";
import { getEditorialOverview } from "@/lib/admin/editorial-read";
import { withEditorRedirect } from "@/lib/admin/redirect";

export const metadata = { title: "Admin — WachSam Editorial" };

export default async function AdminPage() {
  const rows = await withEditorRedirect(() => getEditorialOverview());

  return (
    <section>
      <header className="section-header">
        <div className="strich" aria-hidden="true" />
        <p className="mono-label">Editorial CMS</p>
        <h1 className="focus-title">Admin-Übersicht</h1>
        <p className="lead">Redaktionelle Datentypen, Statusstände und Einstieg in Review, Freigabe und Publikation.</p>
      </header>
      <div className="admin-toolbar">
        <Link className="admin-link" href="/review">Zur Review-Queue</Link>
        <Link className="admin-link" href="/admin/audit">Audit-Log ansehen</Link>
      </div>
      <AdminOverviewTable rows={rows} />
    </section>
  );
}
