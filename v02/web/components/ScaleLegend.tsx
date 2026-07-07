type ScaleLegendVariant = "radar" | "indicators" | "threshold";

const zoneItems = [
  { key: "uncritical", label: "Unkritisch" },
  { key: "elevated", label: "Warn" },
  { key: "critical", label: "Kritisch" },
] as const;

const severityItems = [
  { key: "stabil", label: "Stabil" },
  { key: "beobachten", label: "Beobachten" },
  { key: "erhoeht", label: "Erhöht" },
  { key: "kritisch", label: "Kritisch" },
  { key: "eskalierend", label: "Eskalierend" },
] as const;

const themeStateItems = [
  { key: "normal", label: "Normal" },
  { key: "beobachten", label: "Beobachten" },
  { key: "erhoeht", label: "Erhöht" },
  { key: "hoch", label: "Hoch" },
] as const;

function ZoneList() {
  return (
    <ul className="scale-legend-items">
      {zoneItems.map((item) => (
        <li key={item.key}>
          <span className={`zone-dot zone-dot-${item.key}`} aria-hidden="true" />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function SeverityList() {
  return (
    <ul className="scale-legend-items">
      {severityItems.map((item) => (
        <li key={item.key}>
          <span className={`severity-badge severity-${item.key}`}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function ThemeStateList() {
  return (
    <ul className="scale-legend-items">
      {themeStateItems.map((item) => (
        <li key={item.key}>
          <span className={`theme-state-badge theme-state-${item.key}`}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function ScaleLegend({ variant }: { variant: ScaleLegendVariant }) {
  if (variant === "radar") {
    return (
      <section className="scale-legend" aria-label="Legende der Radar-Stufen">
        <div>
          <p className="mono-label">Legende</p>
          <h2 className="detail-title-small">Radar-Stufe und Treiber-Zone</h2>
          <p>
            Die Radar-Stufe bewertet einen ganzen Themenkanal. Die Treiber-Zone bewertet einzelne
            Messwerte gegen ihre Schwellen.
          </p>
        </div>
        <div className="scale-legend-grid">
          <div>
            <span className="scale-legend-label">Radar-Stufe</span>
            <ThemeStateList />
          </div>
          <div>
            <span className="scale-legend-label">Treiber-Zone</span>
            <ZoneList />
          </div>
        </div>
        <p className="scale-legend-note">
          &quot;Hoch&quot; im Radar heißt: Der Kanal ist breit auffällig. &quot;Kritisch&quot; beschreibt einen
          einzelnen Messwert oder eine Lage-Stufe.
        </p>
      </section>
    );
  }

  if (variant === "threshold") {
    return (
      <section className="scale-legend scale-legend-compact" aria-label="Legende der Schwellenwert-Skala">
        <div>
          <p className="mono-label">Legende</p>
          <h2 className="detail-title-small">Schwellenwert-Zonen</h2>
          <p>
            Die Skala ordnet den aktuellen Messwert nur ein, wenn Warn- und Kritisch-Schwellen vorhanden
            sind.
          </p>
        </div>
        <ZoneList />
      </section>
    );
  }

  return (
    <section className="scale-legend" aria-label="Legende der Indikator-Stufen">
      <div>
        <p className="mono-label">Legende</p>
        <h2 className="detail-title-small">Lage-Stufe und Messwert-Zone</h2>
        <p>
          Die Lage-Stufe beschreibt die redaktionelle Relevanz eines Signals. Die Messwert-Zone zeigt,
          wo der aktuelle Wert im Schwellenband liegt.
        </p>
      </div>
      <div className="scale-legend-grid">
        <div>
          <span className="scale-legend-label">Lage-Stufe</span>
          <SeverityList />
        </div>
        <div>
          <span className="scale-legend-label">Messwert-Zone</span>
          <ZoneList />
        </div>
      </div>
    </section>
  );
}
