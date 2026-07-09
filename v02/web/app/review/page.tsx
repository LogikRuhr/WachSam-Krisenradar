import { EditorialReviewCard } from "@/components/review/EditorialReviewCard";
import { getMobileEditorialReviewQueue } from "@/lib/admin/editorial-read";
import { withEditorRedirect } from "@/lib/admin/redirect";

export default async function ReviewPage() {
  const queue = await withEditorRedirect(() => getMobileEditorialReviewQueue(30));

  return (
    <section>
      <header className="section-header review-header">
        <div className="strich" aria-hidden="true" />
        <p className="mono-label">Editorial Review</p>
        <h1 className="focus-title">Offene Entscheidungen</h1>
        <p className="lead">Mobile Queue für Prüfung, Freigabe und Publikation. Entwürfe bleiben intern bis zur manuellen Veröffentlichung.</p>
      </header>

      {queue.length > 0 ? (
        <div className="review-stack">
          {queue.map((item) => <EditorialReviewCard key={`${item.type}:${item.id}`} item={item} />)}
        </div>
      ) : (
        <div className="review-empty">
          <p className="mono-label">Queue leer</p>
          <p>Keine Entwürfe oder freigegebenen Items offen.</p>
        </div>
      )}
    </section>
  );
}
