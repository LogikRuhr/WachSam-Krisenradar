import { SkeletonLine, SkeletonVitalsBoard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="page-shell" role="status" aria-busy="true">
      <span className="sr-only">Gesamtstand Deutschland wird geladen …</span>
      <SkeletonLine width="30%" className="skeleton-title" />
      <SkeletonLine width="70%" />
      <SkeletonLine width="55%" />
      <div style={{ marginTop: 24 }}>
        <SkeletonVitalsBoard count={4} />
      </div>
    </main>
  );
}
