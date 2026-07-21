import { EditorialReviewCard } from "@/components/review/EditorialReviewCard";
import { getMobileEditorialReviewQueue } from "@/lib/admin/editorial-read";
import { withEditorRedirect } from "@/lib/admin/redirect";
import Link from "next/link";

export default async function ReviewPage() {
  const queue = await withEditorRedirect(() => getMobileEditorialReviewQueue(30));
  const nationalStates = queue.filter((item) => item.type === "nationalState");
  const otherItems = queue.filter((item) => item.type !== "nationalState");

  return (
    <section>
      <header className="section-header review-header">
        <div className="strich" aria-hidden="true" />
        <p className="mono-label">Editorial Review</p>
        <h1 className="focus-title">Gesamtstand zuerst</h1>
        <p className="lead">Eine Entscheidung auf einmal. Entwürfe bleiben intern, bis du Quellen und Kurzlage bewusst freigibst.</p>
      </header>

      <section id="gesamtstand" className="review-priority" aria-labelledby="gesamtstand-title">
        <p className="mono-label">Jetzt prüfen</p>
        <h2 id="gesamtstand-title" className="detail-title-small">Gesamtstand Deutschland</h2>
        {nationalStates.length ? (
          <div className="review-stack">
            {nationalStates.map((item) => <EditorialReviewCard key={`${item.type}:${item.id}`} item={item} />)}
          </div>
        ) : (
          <div className="review-empty">
            <p>Noch kein Gesamtstand als Entwurf vorhanden.</p>
            <Link className="review-button review-button-primary" href="/admin/nationalState/new">Gesamtstand als Draft anlegen</Link>
          </div>
        )}
      </section>

      {otherItems.length ? (
        <details className="review-secondary">
          <summary>{otherItems.length} weitere offene Entscheidungen</summary>
          <div className="review-stack">
            {otherItems.map((item) => <EditorialReviewCard key={`${item.type}:${item.id}`} item={item} />)}
          </div>
        </details>
      ) : null}

      {!queue.length ? (
        <div className="review-empty">
          <p className="mono-label">Queue leer</p>
          <p>Keine weiteren Entwürfe oder freigegebenen Items offen.</p>
        </div>
      ) : null}
    </section>
  );
}
