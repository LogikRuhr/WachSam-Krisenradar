import Link from "next/link";

const pfade = [
  { href: "/lage", label: "Gesamtstand ansehen", text: "Nationale Einordnung und wichtigste Vitalwerte." },
  { href: "/kosten", label: "Haushaltsauswirkungen prüfen", text: "Mögliche Mehrkosten, Versorgung und Alltagseinordnung." },
  { href: "/kaskaden", label: "Zusammenhänge verstehen", text: "Wirkungsketten von Entwicklung bis Haushaltsauswirkung." },
  { href: "/massnahmen", label: "Maßnahmen prüfen", text: "Ruhige, praktische Prüfschritte mit Quellenstand." },
];

export function PfadHub() {
  return (
    <section className="pfad-hub" aria-label="WachSam Pfade">
      {pfade.map((pfad, index) => (
        <Link className="pain-card pfad-card hover-rost" href={pfad.href} key={pfad.href}>
          <span className="pain-num">{String(index + 1).padStart(2, "0")}</span>
          <strong className="pain-title">{pfad.label}</strong>
          <span className="pain-text">{pfad.text}</span>
        </Link>
      ))}
    </section>
  );
}
