import { cookies } from "next/headers";
import { DbNotice } from "@/components/DbNotice";
import { RegionSwitcher } from "@/components/RegionSwitcher";
import { ScaleLegend } from "@/components/ScaleLegend";
import { SectionHeader } from "@/components/SectionHeader";
import { ThemeCard } from "@/components/ThemeCard";
import { getRadarThemes } from "@/lib/radar-data";
import { REGION_COOKIE } from "@/lib/regions";

export const dynamic = "force-dynamic";

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

function formatStand(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : DATE_FMT.format(date);
}

export default async function RadarPage() {
  const region = (await cookies()).get(REGION_COOKIE)?.value ?? null;
  const { themes, warnlage, connected } = await getRadarThemes(region);
  const warnlageStand = formatStand(warnlage.sinceDate);
  const allCalm = themes.every((theme) => theme.state === "normal");

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <SectionHeader label="Radar" title="WachSam Radar">
        <p>Themenkanäle und die amtliche Warnlage — deterministisch aus den zuletzt veröffentlichten Indikatoren abgeleitet.</p>
        <p className="mono-label">
          {warnlageStand ? `Stand amtliche Warnlage: ${warnlageStand}` : "Stand amtliche Warnlage: ausstehend"}
        </p>
      </SectionHeader>

      {!connected ? <DbNotice /> : null}

      <RegionSwitcher currentRegion={region} />
      <ScaleLegend variant="radar" />

      <div className="theme-warnlage-slot">
        <ThemeCard theme={warnlage} />
      </div>

      {connected ? (
        allCalm ? (
          <section className="hero-card">
            <p className="lead">Aktuell keine erhöhten Themen.</p>
          </section>
        ) : (
          <section className="themes-grid" aria-label="Themenkanäle">
            {themes.map((theme) => (
              <ThemeCard key={theme.key} theme={theme} />
            ))}
          </section>
        )
      ) : null}
    </main>
  );
}
