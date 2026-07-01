import type { MobileEditorialReviewItem } from "@/lib/admin/editorial-read";
import { editorialStatusExplain, editorialStatusLabel } from "@/lib/editorial";
import { ReviewActions, SourceBlock, auditReasonText, formatDate } from "./EditorialReviewCard";

export function EditorialReviewDetail({ item }: { item: MobileEditorialReviewItem }) {
  return (
    <article className="review-detail">
      <section className="review-detail-panel" aria-labelledby="review-status-title">
        <div>
          <p className="mono-label">{item.label}</p>
          <h2 id="review-status-title" className="detail-title-small">Review-Status</h2>
        </div>
        <span className={`admin-status admin-status-${item.status}`}>{editorialStatusLabel(item.status)}</span>
        <p>{editorialStatusExplain(item.status)}</p>
        <dl className="review-meta">
          <div><dt>Geprüft</dt><dd>{formatDate(item.editorialReviewedAt)}</dd></div>
          <div><dt>Publiziert</dt><dd>{formatDate(item.publishedAt)}</dd></div>
          <div><dt>ID</dt><dd><code>{item.id}</code></dd></div>
        </dl>
        <ReviewActions item={item} />
      </section>

      <section className="review-detail-panel" aria-labelledby="review-source-title">
        <p className="mono-label">Quelle</p>
        <h2 id="review-source-title" className="detail-title-small">Provenienz</h2>
        <SourceBlock item={item} />
      </section>

      <section className="review-detail-panel" aria-labelledby="review-audit-title">
        <p className="mono-label">Audit</p>
        <h2 id="review-audit-title" className="detail-title-small">Letzter Hinweis</h2>
        <p>{auditReasonText(item.latestAudit?.reason ?? null)}</p>
      </section>

      <section className="review-detail-panel" aria-labelledby="review-fields-title">
        <p className="mono-label">Datensatz</p>
        <h2 id="review-fields-title" className="detail-title-small">Review-Felder</h2>
        <dl className="review-field-list">
          {item.fields.map((field) => (
            <div key={field.name}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}
