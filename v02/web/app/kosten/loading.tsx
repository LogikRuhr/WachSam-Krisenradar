import { SkeletonCard, SkeletonLine } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="page-shell" role="status" aria-busy="true">
      <span className="sr-only">Kostenradar wird geladen …</span>
      <SkeletonLine width="30%" className="skeleton-title" />
      <SkeletonLine width="70%" />
      <div className="signals-grid" style={{ marginTop: 24 }}>
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </main>
  );
}
