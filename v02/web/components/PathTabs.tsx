"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "@/lib/nav-active";

const tabs = [
  ["/kosten", "Haushalt"],
  ["/lage", "Lage"],
  ["/radar", "Radar"],
  ["/woche", "Woche"],
  ["/kaskaden", "Wirkungsketten"],
  ["/massnahmen", "Maßnahmen"],
] as const;

/**
 * Tab-Links der TopNav-Hauptnavigation. Markiert den aktiven Tab über
 * `usePathname` + `isActivePath` (lib/nav-active.ts) — derselbe Helper, den
 * BottomNav (Task 1) verwendet. Rendert nur die Link-Liste; das umschließende
 * `<nav aria-label="WachSam Hauptnavigation">` bleibt in TopNav.tsx, damit die
 * dort geprüfte aria-label-Struktur unverändert bleibt.
 */
export function PathTabs() {
  const pathname = usePathname();

  return (
    <>
      {tabs.map(([href, label]) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            aria-current={active ? "page" : undefined}
            className={`path-tab hover-rost${active ? " path-tab-active" : ""}`}
            href={href}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
