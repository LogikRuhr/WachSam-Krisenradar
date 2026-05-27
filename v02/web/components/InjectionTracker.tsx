interface InjectionTrackerProps {
  daysRemaining: number;
  gapToTarget: number;
  requiredDailyRate: number;
  actualDailyChange: number | null;
  onTrack: boolean | null;
  periodActive: boolean;
  targetLabel: string;
  unit: string;
}

function formatRate(value: number): string {
  if (!isFinite(value)) return "—";
  return value.toFixed(2);
}

export function InjectionTracker({
  daysRemaining,
  gapToTarget,
  requiredDailyRate,
  actualDailyChange,
  onTrack,
  periodActive,
  targetLabel,
  unit,
}: InjectionTrackerProps) {
  // Goal already reached
  if (gapToTarget === 0) {
    return (
      <section className="detail-panel">
        <h2 className="detail-title-small">Einspeisungsperiode</h2>
        <span className="mono-label">{targetLabel}</span>
        <div className="injection-status" style={{ marginTop: 12 }}>
          <span className="injection-dot injection-dot-ok" />
          <span className="injection-label">Ziel erreicht.</span>
        </div>
      </section>
    );
  }

  // Period expired
  if (!periodActive) {
    return (
      <section className="detail-panel">
        <h2 className="detail-title-small">Einspeisungsperiode</h2>
        <span className="mono-label">{targetLabel}</span>
        <div className="injection-status" style={{ marginTop: 12 }}>
          <span className="injection-dot injection-dot-behind" />
          <span className="injection-label">Die Einspeisungsperiode ist abgelaufen.</span>
        </div>
      </section>
    );
  }

  const dotClass =
    onTrack === true
      ? "injection-dot-ok"
      : onTrack === false
        ? "injection-dot-behind"
        : "injection-dot-unknown";

  const statusText =
    onTrack === true
      ? "Auf Kurs"
      : onTrack === false
        ? "Unter dem nötigen Tempo"
        : "Keine Bewertung möglich";

  return (
    <section className="detail-panel">
      <h2 className="detail-title-small">Einspeisungsperiode</h2>
      <span className="mono-label">{targetLabel}</span>
      <dl className="detail-dl" style={{ marginTop: 12 }}>
        <dt>Restliche Tage</dt>
        <dd>{daysRemaining} Tage</dd>
        <dt>Fehlend bis Ziel</dt>
        <dd>{formatRate(gapToTarget)} Prozentpunkte</dd>
        <dt>Nötige Tages-Einspeisung</dt>
        <dd>{formatRate(requiredDailyRate)} {unit}/Tag</dd>
        <dt>Tatsächliche Veränderung</dt>
        <dd>
          {actualDailyChange != null
            ? `${formatRate(actualDailyChange)} ${unit}/Tag`
            : "Kein Vergleichswert"}
        </dd>
      </dl>
      <div className="injection-status">
        <span className={`injection-dot ${dotClass}`} />
        <span className="injection-label">{statusText}</span>
      </div>
    </section>
  );
}
