/**
 * Bestimmt, ob ein Navigations-Ziel (`href`) für den aktuellen Pfad
 * (`pathname`) als aktiv markiert werden soll.
 *
 * Home (`/`) matcht nur exakt, alle anderen Ziele per Segment-Präfix
 * (`pathname === href` oder `pathname` beginnt mit `href + "/"`), damit z.B.
 * `/kaskaden/xyz` den `/kaskaden`-Tab markiert, aber `/kostenlos` NICHT den
 * `/kosten`-Tab (keine reine String-Präfix-Prüfung ohne Segmentgrenze).
 */
export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
