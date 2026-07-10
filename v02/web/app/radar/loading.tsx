import { SkeletonLine, SkeletonVitalsBoard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="page-shell" role="status" aria-busy="true">
      <span className="sr-only">Treiber und Themenkanäle werden geladen …</span>
      <SkeletonLine width="30%" className="skeleton-title" />
      <SkeletonLine width="70%" />
      <div style={{ marginTop: 24 }}>
        <SkeletonVitalsBoard count={5} />
      </div>
    </main>
  );
}
