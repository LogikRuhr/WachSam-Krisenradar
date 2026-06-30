import Link from "next/link";
import type { PriceRadarCard } from "@/lib/price-radar";

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" });

const NUMBER_FMT = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 3,
});

function formatStand(value: Date | null) {
  return value ? DATE_FMT.format(value) : "Stand ausstehend";
}

function unitLabel(unit: string | null) {
  if (!unit) return "";
  return unit === "Euro/Liter" ? "€/l" : unit;
}

function formatValue(card: PriceRadarCard) {
  if (card.value == null) return "Stand ausstehend";
  return `${NUMBER_FMT.format(card.value)} ${unitLabel(card.unit)}`.trim();
}

function PriceCard({ card }: { card: PriceRadarCard }) {
  const className = [
    "price-card",
    card.zone ? `price-card-${card.zone}` : "",
    card.sourceStatusTone !== "none" ? `price-card-source-${card.sourceStatusTone}` : "",
  ].filter(Boolean).join(" ");

  const content = (
    <>
      <div className="price-card-head">
        <span className="mono-label">{card.group === "fuel" ? "Tankstelle" : "Haushaltsenergie"}</span>
        <span className={`source-pill source-pill-${card.sourceStatusTone}`}>{card.sourceStatusLabel}</span>
      </div>
      <span className="price-label">{card.label}</span>
      <span className={card.pending ? "price-value price-value-pending" : "price-value"}>{formatValue(card)}</span>
      <span className="price-description">{card.description}</span>
      <span className="mono-label price-source">
        {card.sourceName} · {formatStand(card.stand)}
      </span>
      <span className="price-note">{card.sourceNote}</span>
    </>
  );

  return card.href ? (
    <Link className={`${className} hover-rost`} href={card.href} aria-label={`${card.label} im Indikator öffnen`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function PriceRadar({ cards }: { cards: PriceRadarCard[] }) {
  if (cards.length === 0) return null;

  return (
    <section className="price-radar" aria-labelledby="price-radar-title">
      <div className="home-section-head price-radar-head">
        <p className="mono-label">Preisradar</p>
        <h2 id="price-radar-title" className="detail-title-small">Sprit, Strom und Gas auf einen Blick</h2>
        <p>
          Prominent erscheinen nur Werte mit Quelle und Stand. Live-Stichproben und redaktionelle Monatsstände
          werden sichtbar getrennt.
        </p>
      </div>
      <div className="price-grid">
        {cards.map((card) => (
          <PriceCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
