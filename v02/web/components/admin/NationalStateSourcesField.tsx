"use client";

import { useState } from "react";
import type { EditorialItem } from "@/lib/admin/editorial-read";

type SourceDraft = {
  sourceName: string;
  sourceUrl: string;
  sourceStand: string;
  isPrimarySource: boolean;
};

const emptySource = (): SourceDraft => ({ sourceName: "", sourceUrl: "", sourceStand: "", isPrimarySource: true });

function sourceDrafts(item: EditorialItem | null): SourceDraft[] {
  const value = item?.sources;
  if (!Array.isArray(value)) return [emptySource()];
  const sources = value.flatMap((source) => {
    if (!source || typeof source !== "object") return [];
    const row = source as Partial<SourceDraft>;
    return [{
      sourceName: String(row.sourceName ?? ""),
      sourceUrl: String(row.sourceUrl ?? ""),
      sourceStand: String(row.sourceStand ?? ""),
      isPrimarySource: row.isPrimarySource !== false,
    }];
  });
  return sources.length ? sources : [emptySource()];
}

export function NationalStateSourcesField({
  item,
  disabled,
  error,
}: {
  item: EditorialItem | null;
  disabled: boolean;
  error?: string;
}) {
  const [sources, setSources] = useState(() => sourceDrafts(item));
  const update = (index: number, patch: Partial<SourceDraft>) => {
    setSources((current) => current.map((source, sourceIndex) => sourceIndex === index ? { ...source, ...patch } : source));
  };

  return (
    <fieldset className="admin-field national-state-sources" disabled={disabled}>
      <legend className="admin-label">Primärquellen *</legend>
      <p className="admin-help">Nur offizielle, direkt prüfbare Quellen eintragen. Der Stand ist der Stand der Quelle, nicht der Abrufzeitpunkt.</p>
      <input name="sources" type="hidden" value={JSON.stringify(sources)} />
      {sources.map((source, index) => (
        <div className="national-state-source-row" key={index}>
          <label>
            <span>Quelle</span>
            <input className="admin-input" value={source.sourceName} onChange={(event) => update(index, { sourceName: event.target.value })} required />
          </label>
          <label>
            <span>HTTPS-URL</span>
            <input className="admin-input" type="url" value={source.sourceUrl} onChange={(event) => update(index, { sourceUrl: event.target.value })} required />
          </label>
          <label>
            <span>Quellenstand</span>
            <input className="admin-input" value={source.sourceStand} onChange={(event) => update(index, { sourceStand: event.target.value })} required />
          </label>
          <label className="national-state-primary">
            <input type="checkbox" checked={source.isPrimarySource} onChange={(event) => update(index, { isPrimarySource: event.target.checked })} />
            Primärquelle
          </label>
          {sources.length > 1 ? <button className="review-button" type="button" onClick={() => setSources((current) => current.filter((_, sourceIndex) => sourceIndex !== index))}>Quelle entfernen</button> : null}
        </div>
      ))}
      <button className="review-button" type="button" onClick={() => setSources((current) => [...current, emptySource()])}>Weitere Quelle</button>
      {error ? <span className="admin-field-error">{error}</span> : null}
    </fieldset>
  );
}
