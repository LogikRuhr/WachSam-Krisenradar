const steps = [
  {
    title: "Was gerade läuft",
    text: "Die wichtigsten Entwicklungen mit Relevanz für Deutschland.",
  },
  {
    title: "Was es für Haushalte bedeutet",
    text: "Kosten, Versorgung, Mobilität, Gesundheit, Arbeit und Planung verständlich eingeordnet.",
  },
  {
    title: "Was du tun kannst",
    text: "Ruhige Prüfschritte mit Aufwand, Quellenstand und Unsicherheit.",
  },
];

export function HomeStorySteps() {
  return (
    <ol className="home-steps" aria-label="So liest WachSam die Lage">
      {steps.map((step, index) => (
        <li className="home-step" key={step.title}>
          <span className="pain-num">{String(index + 1).padStart(2, "0")}</span>
          <h2 className="pain-title">{step.title}</h2>
          <p>{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
