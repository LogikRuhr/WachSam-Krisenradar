import type { Metadata } from "next";
import Link from "next/link";
import { DbNotice } from "@/components/DbNotice";
import { SectionHeader } from "@/components/SectionHeader";
import { getSourceHealthOverview } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Systemstatus & Datenaktualität · WachSam",
  description: "Status und letzter erfolgreicher Abruf der angebundenen Datenquellen.",
};

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

const STATUS_META: Record<string, { label: string; tone: string }> = {
  fresh: { label: "Aktuell", tone: "uncritical" },
  stale: { label: "Veraltet", tone: "elevated" },
  error: { label: "Fehler", tone: "critical" },
  anomaly: { label: "Auffällig", tone: "elevated" },
  disabled: { label: "Deaktiviert", tone: "none" },
  unknown: { label: "Unbekannt", tone: "none" },
};

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, tone: "none" };
}

function formatStand(value: Date | null) {
  return value ? DATE_FMT.format(value) : "—";
}

export default async function StatusPage() {
  const health = await getSourceHealthOverview();

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <SectionHeader label="Systemstatus" title="Datenaktualität">
        <p>
          Status und letzter erfolgreicher Abruf der angebundenen Datenquellen. WachSam zeigt
          Aktualität offen — ohne Fake-Live-Optik. Interne Fehlerdetails werden hier bewusst nicht angezeigt.
        </p>
      </SectionHeader>

      {!health.connected ? (
        <DbNotice error={health.error} />
      ) : health.rows.length === 0 ? (
        <section className="hero-card">
          <p className="lead">
            Noch keine Statusdaten verfügbar. Sobald die Datenanbindung ihre Prüfungen protokolliert,
            erscheinen hier Quelle, Status und letzter erfolgreicher Abruf.
          </p>
        </section>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Quelle</th>
                <th>Ziel</th>
                <th>Status</th>
                <th>Letzter Erfolg</th>
                <th>Zuletzt geprüft</th>
                <th>Treffer</th>
              </tr>
            </thead>
            <tbody>
              {health.rows.map((row) => {
                const meta = statusMeta(row.status);
                return (
                  <tr key={`${row.sourceName}-${row.target}`}>
                    <td data-label="Quelle">{row.sourceName}</td>
                    <td data-label="Ziel">
                      <code>{row.target}</code>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge status-${meta.tone}`}>{meta.label}</span>
                    </td>
                    <td data-label="Letzter Erfolg">{formatStand(row.lastSuccessAt)}</td>
                    <td data-label="Zuletzt geprüft">{formatStand(row.lastCheckedAt)}</td>
                    <td data-label="Treffer">
                      {row.itemCount}
                      {row.errorCount > 0 ? ` · ${row.errorCount} Fehler` : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mono-label status-health-link">
        Technischer Health-Check:{" "}
        <Link className="text-link" href="/api/health">
          /api/health
        </Link>
      </p>
    </main>
  );
}
