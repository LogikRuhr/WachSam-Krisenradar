import type { Metadata } from "next";

export const metadata: Metadata = { title: "Impressum — WachSam" };

export default function ImpressumPage() {
  return (
    <main className="page-shell">
      <div className="mx-auto max-w-3xl">
        <div aria-hidden="true" className="mb-3 h-[3px] w-10 bg-[var(--primary)]" />
        <h1 className="font-display text-4xl tracking-wide">Impressum</h1>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--on-surface-variant)]">
          <h2 className="font-semibold text-[var(--on-surface)]">Angaben gemäß § 5 TMG / § 18 MStV</h2>
          <p>
            Jean Schütz<br />
            RuhrLogik<br />
            {/* Postanschrift wird manuell auf dem Server ergänzt */}
          </p>

          <h2 className="font-semibold text-[var(--on-surface)]">Kontakt</h2>
          <p>
            E-Mail: kontakt [at] ruhrlogik.de
          </p>

          <h2 className="font-semibold text-[var(--on-surface)]">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>Jean Schütz (Anschrift wie oben)</p>

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
