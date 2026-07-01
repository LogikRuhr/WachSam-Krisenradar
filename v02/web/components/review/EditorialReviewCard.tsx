import Link from "next/link";
import { approveReviewItem, publishReviewItem, rejectReviewItem } from "@/app/review/actions";
import type { MobileEditorialReviewItem } from "@/lib/admin/editorial-read";
import { editorialActionLabel, editorialStatusExplain, editorialStatusLabel } from "@/lib/editorial";

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function auditReasonText(reason: string | null) {
  if (!reason) return "Kein Audit-Hinweis gespeichert.";
  try {
    const parsed = JSON.parse(reason) as { validation_errors?: string[]; validation_warnings?: string[] };
    const parts = [];
    if (parsed.validation_errors?.length) parts.push(`Fehler: ${parsed.validation_errors.join("; ")}`);
    if (parsed.validation_warnings?.length) parts.push(`Hinweise: ${parsed.validation_warnings.join("; ")}`);
    return parts.join(" · ") || reason;
  } catch {
    return reason;
  }
}

function ReviewActions({ item, compact = false }: { item: MobileEditorialReviewItem; compact?: boolean }) {
  const approve = approveReviewItem.bind(null, item.type);
  const publish = publishReviewItem.bind(null, item.type);
  const reject = rejectReviewItem.bind(null, item.type);

  return (
    <div className={compact ? "review-actions review-actions-compact" : "review-actions"}>
      {item.status === "draft" ? (
        <form action={approve}>
          <input type="hidden" name="id" value={item.id} />
          <button className="review-button review-button-primary" type="submit">Freigeben</button>
        </form>
      ) : null}
      {item.status === "approved" ? (
        <form action={publish}>
          <input type="hidden" name="id" value={item.id} />
          <button className="review-button review-button-primary" type="submit">Publizieren</button>
        </form>
      ) : null}
      {item.status === "draft" || item.status === "approved" ? (
        <form action={reject} className="review-reject-form">
          <input type="hidden" name="id" value={item.id} />
          <input
            className="review-input"
            name="reason"
            minLength={3}
            maxLength={1000}
            required
            placeholder="Ablehnungsgrund"
          />
          <button className="review-button" type="submit">Ablehnen</button>
        </form>
      ) : null}
    </div>
  );
}

function SourceBlock({ item }: { item: MobileEditorialReviewItem }) {
  if (!item.source) {
    return <p className="review-muted">Keine separate Quelle am Item hinterlegt.</p>;
  }
  const isExternal = item.source.sourceUrl.startsWith("http://") || item.source.sourceUrl.startsWith("https://");
  return (
    <div className="review-source">
      <span>{item.source.sourceName}</span>
      <strong>Stand: {item.source.sourceStand}</strong>
      {isExternal ? (
        <a href={item.source.sourceUrl} target="_blank" rel="noreferrer">Quelle öffnen</a>
      ) : (
        <code>{item.source.sourceUrl}</code>
      )}
    </div>
  );
}

export function EditorialReviewCard({ item }: { item: MobileEditorialReviewItem }) {
  const auditAction = item.latestAudit ? editorialActionLabel(item.latestAudit.action) : "—";

  return (
    <article className="review-card">
      <header className="review-card-header">
        <div>
          <p className="mono-label">{item.label}</p>
          <h2>{item.title}</h2>
        </div>
        <span className={`admin-status admin-status-${item.status}`}>{editorialStatusLabel(item.status)}</span>
      </header>

      <p className="review-description">{item.description}</p>

      <dl className="review-meta">
        <div><dt>Confidence</dt><dd>{item.confidence ?? "—"}</dd></div>
        <div><dt>Eingang</dt><dd>{formatDate(item.queuedAt)}</dd></div>
        <div><dt>ID</dt><dd><code>{item.id}</code></dd></div>
      </dl>

      <SourceBlock item={item} />

      <div className="review-audit">
        <span>Letzter Audit-Schritt: {auditAction}</span>
        <p>{auditReasonText(item.latestAudit?.reason ?? null)}</p>
      </div>

      <p className="review-status-explain">{editorialStatusExplain(item.status)}</p>

      <footer className="review-card-footer">
        <Link className="review-button" href={`/review/${item.type}/${item.id}`}>Details</Link>
        <ReviewActions item={item} compact />
      </footer>
    </article>
  );
}

export { ReviewActions, SourceBlock, auditReasonText, formatDate };
