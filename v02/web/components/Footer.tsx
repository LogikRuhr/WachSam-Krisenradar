import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--outline)] bg-[var(--surface-container)] px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs text-[var(--on-surface-variant)]">
          © {new Date().getFullYear()} RuhrLogik · WachSam Krisenradar
        </p>
        <nav className="flex gap-4 font-mono text-xs text-[var(--on-surface-variant)]">
          <Link href="/impressum" className="hover:text-[var(--primary)]">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-[var(--primary)]">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}
