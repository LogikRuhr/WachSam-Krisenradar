import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <p className="mono-label">
            © {new Date().getFullYear()} RuhrLogik · WachSam Krisenradar
          </p>
          <p className="footer-transparency">
            WachSam liefert Orientierung auf Basis öffentlicher Quellen und redaktioneller Einordnung. Die Plattform ersetzt keine Behördeninformationen und keine rechtliche, medizinische oder finanzielle Beratung.
          </p>
        </div>
        <nav className="site-footer-links">
          <Link href="/impressum">
            Impressum
          </Link>
          <Link href="/datenschutz">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}
