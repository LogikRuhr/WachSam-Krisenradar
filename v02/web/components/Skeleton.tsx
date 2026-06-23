/**
 * Skeleton-Platzhalter für Ladezustände (Next.js loading.tsx). Reine CSS-Animation,
 * `aria-hidden` — der Ladehinweis selbst wird vom umgebenden role="status" angesagt.
 * Respektiert prefers-reduced-motion (siehe globals.css).
 */

export function SkeletonLine({ width, className }: { width?: string; className?: string }) {
  return (
    <span
      className={`skeleton skeleton-line${className ? ` ${className}` : ""}`}
      style={width ? { width } : undefined}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <SkeletonLine width="40%" />
      <SkeletonLine width="80%" />
      <SkeletonLine width="55%" />
    </div>
  );
}

/** Platzhalter-Grid für das Vitalwerte-Board (gleiches Grid wie VitalsBoard). */
export function SkeletonVitalsBoard({ count = 4 }: { count?: number }) {
  return (
    <div className="vitals-board" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
