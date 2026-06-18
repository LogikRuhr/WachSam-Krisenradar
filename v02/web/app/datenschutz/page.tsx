import type { Metadata } from "next";

export const metadata: Metadata = { title: "Datenschutz — WachSam" };

export default function DatenschutzPage() {
  return (
    <main className="page-shell">
      <div className="mx-auto max-w-3xl">
        <div aria-hidden="true" className="mb-3 h-[3px] w-10 bg-[var(--primary)]" />
        <h1 className="font-display text-4xl tracking-wide">Datenschutzerklärung</h1>

        <section className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--on-surface-variant)]">

          <div>
            <h2 className="font-semibold text-[var(--on-surface)]">1. Verantwortlicher</h2>
            <p className="mt-2">
              Jean Schütz, RuhrLogik<br />
              Kantstraße 27, 46240 Bottrop<br />
              Telefon: 015228657354<br />
              E-Mail: datenschutz@ruhrlogik.de
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-[var(--on-surface)]">2. Welche Daten wir verarbeiten</h2>
            <p className="mt-2">WachSam verarbeitet nur die Daten, die für den Betrieb der Plattform notwendig sind:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li><strong>E-Mail-Adresse</strong> — für die Anmeldung per Magic-Link (Auth.js v5 via Resend)</li>
              <li><strong>Session-Cookie</strong> — technisch notwendig für die Sitzungsverwaltung, kein Tracking</li>
              <li><strong>Haushalts-Profil</strong> — anonymisierter Modus (Single/Familie/Selbstständig/Rentner) und PLZ, keine personenbezogenen Scores</li>
              <li><strong>Feedback</strong> — frei eingegebener Text sowie optionale Kategorie, Bewertung und freiwillige Kontakt-E-Mail. Bei angemeldeten Nutzern wird das Feedback mit dem Konto verknüpft, sonst anonym gespeichert. Es werden keine IP-Adressen gespeichert.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-[var(--on-surface)]">3. Rechtsgrundlage</h2>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) — für die Erstellung eines Kontos</li>
              <li>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) — für technisch notwendige Session-Cookies</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-[var(--on-surface)]">4. Kein Tracking, keine Analytics</h2>
            <p className="mt-2">
              WachSam verwendet <strong>keine</strong> Tracking-Dienste, keine Analytics-Dienste,
              keine Werbe-Cookies und keine Drittanbieter-Skripte. Es gibt keinen Google Analytics,
              kein Meta Pixel und kein vergleichbares System.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-[var(--on-surface)]">5. Speicherdauer</h2>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Session-Cookies: bis zum Ende der Browser-Sitzung oder Logout</li>
              <li>E-Mail-Adresse: bis zur Kontolöschung</li>
              <li>Haushalts-Profil: bis zur Kontolöschung</li>
              <li>Feedback-Einträge: bis zur Bearbeitung des Anliegens, längstens 24 Monate</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-[var(--on-surface)]">6. Hosting und Auftragsverarbeitung</h2>
            <p className="mt-2">
              WachSam wird auf einem IONOS-VPS in Deutschland gehostet; das Hosting findet
              innerhalb der EU statt.
            </p>
            <p className="mt-2">
              Für den Versand der Magic-Link-E-Mails setzen wir Resend (Resend Inc.) als
              Auftragsverarbeiter im Sinne von Art. 28 DSGVO ein. Dabei wird Ihre E-Mail-Adresse
              an Resend übermittelt, um den Anmelde-Link zuzustellen. Mit Resend besteht ein
              Auftragsverarbeitungsvertrag. Soweit dabei eine Verarbeitung in einem Drittland
              (USA) erfolgt, stützt sie sich auf das EU-US Data Privacy Framework bzw. auf
              Standardvertragsklauseln der EU-Kommission (Art. 46 DSGVO).
            </p>
            <p className="mt-2">
              Für die KI-gestützte Erstellung von Lage-Einordnungen und Handlungshinweisen
              setzen wir Vertex AI (Gemini, Google Cloud, Region europe-west3) ein. Die Texte
              werden aus öffentlichen Quellen generiert; dabei werden keine personenbezogenen
              Daten der Nutzerinnen und Nutzer an Vertex AI übermittelt.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-[var(--on-surface)]">7. Ihre Rechte</h2>
            <p className="mt-2">Sie haben das Recht auf:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              <li>Beschwerde bei einer Aufsichtsbehörde</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-[var(--on-surface)]">8. Kontakt für Datenschutzanfragen</h2>
            <p className="mt-2">
              E-Mail: datenschutz@ruhrlogik.de
            </p>
          </div>

        </section>
      </div>
    </main>
  );
}
