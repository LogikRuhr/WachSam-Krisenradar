import Link from "next/link";

type LageViewKey = "gesamtstand" | "lagebild" | "radar" | "woche";

const views: Array<{ key: LageViewKey; href: string; label: string; description: string }> = [
  {
    key: "gesamtstand",
    href: "/lage",
    label: "Gesamtstand",
    description: "Nationale Einordnung und Vitalwerte.",
  },
  {
    key: "lagebild",
    href: "/lagebild",
    label: "Lagebild",
    description: "Zehn Bereiche mit Wirkung auf Haushalte.",
  },
  {
    key: "radar",
    href: "/radar",
    label: "Radar",
    description: "Themenkanäle aus aktuellen Indikatoren.",
  },
  {
    key: "woche",
    href: "/woche",
    label: "Woche",
    description: "Stufenwechsel und Bewegungen.",
  },
];

export function LageViewsNav({ current }: { current: LageViewKey }) {
  return (
    <nav className="lage-view-nav" aria-label="Lage-Sichten">
      <p className="mono-label">Lage-Sichten</p>
      <div className="lage-view-links">
        {views.map((view) => (
          <Link
            key={view.key}
            className={`lage-view-link${view.key === current ? " lage-view-link-active" : ""}`}
            href={view.href}
            aria-current={view.key === current ? "page" : undefined}
          >
            <strong>{view.label}</strong>
            <span>{view.description}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
