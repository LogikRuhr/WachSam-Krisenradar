import Link from "next/link";

const pfade = [
  { href: "/lagebild", label: "Was gerade läuft", text: "Die Lage Deutschlands über zehn Systembereiche." },
  { href: "/kosten", label: "Was es kostet", text: "Mehrkosten für Haushalte nach Bereichen und Zeitfenstern." },
  { href: "/kaskaden", label: "Warum das zusammenhängt", text: "Wirkungsketten von Signal bis Haushaltswirkung." },
  { href: "/massnahmen", label: "Was ich tun kann", text: "Ruhige, praktische Prüfschritte ohne Alarmismus." },
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
