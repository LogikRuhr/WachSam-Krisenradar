import Link from "next/link";

const pfade = [
  { href: "/kosten", label: "Was teurer wird", text: "Mehrkosten nach Bereichen und Zeitfenstern einordnen." },
  { href: "/versorgung", label: "Was knapp werden kann", text: "Bereiche, in denen Engpässe oder Verzögerungen entstehen können." },
  { href: "/massnahmen", label: "Was ich tun kann", text: "Ruhige, praktische Maßnahmen ohne Alarmismus." },
  { href: "/indikatoren", label: "Was als Nächstes kommt", text: "Frühwarnindikatoren und Schwellen beobachten." },
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
