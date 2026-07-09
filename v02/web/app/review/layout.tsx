import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireEditorRole } from "@/lib/admin/permissions";

export const metadata = { title: "Review — WachSam Editorial" };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ReviewLayout({ children }: { children: ReactNode }) {
  try {
    await requireEditorRole();
  } catch {
    redirect("/login");
  }

  return (
    <main className="page-shell review-shell">
      <nav className="review-nav" aria-label="Review Navigation">
        <Link href="/review">Review</Link>
        <Link href="/admin">Admin</Link>
        <Link href="/admin/audit">Audit</Link>
      </nav>
      {children}
    </main>
  );
}
