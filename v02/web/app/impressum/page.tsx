import type { Metadata } from "next";

export const metadata: Metadata = { title: "Impressum — WachSam" };

export default function ImpressumPage() {
  return (
    <main className="page-shell">
      <div className="mx-auto max-w-3xl">
        <div aria-hidden="true" className="mb-3 h-[3px] w-10 bg-[var(--primary)]" />
        <h1 className="font-display text-4xl tracking-wide">Impressum</h1>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--on-surface-variant)]">
          <h2 className="font-semibold text-[var(--on-surface)]">Angaben gemäß § 5 DDG (ehem. § 5 TMG) / § 18 Abs. 2 MStV</h2>
          <p>
            Jean Schütz<br />
            RuhrLogik<br />
            Kantstraße 27<br />
            46240 Bottrop
          </p>

          <h2 className="font-semibold text-[var(--on-surface)]">Kontakt</h2>
          <p>
            Telefon: 015228657354<br />
            E-Mail: info@ruhrlogik.de
          </p>

          <h2 className="font-semibold text-[var(--on-surface)]">Redaktionell verantwortlich (§ 18 Abs. 2 MStV)</h2>
          <p>
            Jean Schütz<br />
            Kantstraße 27<br />
            46240 Bottrop
          </p>

          <h2 className="font-semibold text-[var(--on-surface)]">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
          <p>
            Wir nehmen an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil.
            Zuständig ist die Universalschlichtungsstelle des Zentrums für Schlichtung e.V.,
            Straßburger Straße 8, 77694 Kehl am Rhein
            (<a href="https://www.verbraucher-schlichter.de" target="_blank" rel="noopener noreferrer">www.verbraucher-schlichter.de</a>).
          </p>

          <h2 className="font-semibold text-[var(--on-surface)]">Haftungsausschluss</h2>
          <p>
            Die Inhalte dieser Plattform dienen der allgemeinen Information. Sie stellen keine
            individuelle Beratung dar — weder finanziell, rechtlich, medizinisch noch sicherheitstechnisch.
            WachSam arbeitet probabilistisch und kennzeichnet Unsicherheiten offen.
            Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird keine Gewähr übernommen.
          </p>

          <h2 className="font-semibold text-[var(--on-surface)]">Externe Links</h2>
          <p>
            WachSam verlinkt auf externe Quellen. Für deren Inhalte sind die jeweiligen Betreiber verantwortlich.
            Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar.
          </p>
        </section>
      </div>
    </main>
  );
}
