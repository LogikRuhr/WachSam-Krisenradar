"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const sections = [
  ["/lagebild", "Lagebild"],
  ["/kosten", "Kosten"],
  ["/versorgung", "Versorgung"],
  ["/kaskaden", "Kaskaden"],
  ["/massnahmen", "Maßnahmen"],
  ["/quellen", "Quellen"],
  ["/governance", "Vertrauenslage"],
  ["/indikatoren", "Indikatoren"],
];

export function WerkzeugeDrawer() {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        aria-controls="werkzeuge-drawer"
        aria-expanded={open}
        className="drawer-trigger"
        type="button"
        onClick={() => setOpen(true)}
      >
        Weitere Bereiche
      </button>
      <div className="drawer-root">
        <div className={open ? "drawer-backdrop open" : "drawer-backdrop"} onClick={() => setOpen(false)} />
        <aside
          aria-hidden={!open}
          aria-labelledby="werkzeuge-title"
          aria-modal={open}
          className={open ? "werkzeuge-drawer open" : "werkzeuge-drawer"}
          id="werkzeuge-drawer"
          role="dialog"
        >
        <button
          ref={closeButtonRef}
          className="drawer-close"
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Weitere Bereiche schließen"
        >
          ×
        </button>
        <p className="mono-label">Navigation</p>
        <h2 className="drawer-title" id="werkzeuge-title">Weitere Bereiche</h2>
        <nav className="drawer-links" aria-label="Weitere Bereiche">
          {sections.map(([href, label]) => (
            <Link href={href} key={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
        </aside>
      </div>
    </>
  );
}
