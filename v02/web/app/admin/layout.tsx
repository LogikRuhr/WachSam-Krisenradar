import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireEditorRole } from "@/lib/admin/permissions";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireEditorRole();
  } catch {
    redirect("/login");
  }

  return (
    <main className="page-shell admin-shell">
      <nav className="admin-nav" aria-label="Admin Navigation">
        <Link href="/admin">Übersicht</Link>
        <Link href="/admin/feedback">Feedback</Link>
        <Link href="/admin/audit">Audit</Link>
      </nav>
      {children}
    </main>
  );
}
