"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "@/lib/nav-active";

const targets = [
  ["/", "Start"],
  ["/lage", "Lage"],
  ["/radar", "Radar"],
  ["/massnahmen", "Maßnahmen"],
] as const;

/**
 * Daumenzonen-Navigation für Mobile (≤820px, siehe globals.css). Auf Desktop
 * per CSS ausgeblendet (`.bottom-nav { display: none }`). Aktiver Tab wird
 * über `usePathname` + `isActivePath` (lib/nav-active.ts) bestimmt — derselbe
 * Helper, den Task 3 (TopNav-Aktivzustand) wiederverwendet.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="WachSam Schnellzugriff" className="bottom-nav">
      {targets.map(([href, label]) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            aria-current={active ? "page" : undefined}
            className={`bottom-nav-link${active ? " bottom-nav-link-active" : ""}`}
            href={href}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
