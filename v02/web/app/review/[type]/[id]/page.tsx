import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorialReviewDetail } from "@/components/review/EditorialReviewDetail";
import { getMobileEditorialReviewItem, parseEditorialType } from "@/lib/admin/editorial-read";

export default async function ReviewDetailPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type: typeParam, id } = await params;
  const itemType = parseEditorialType(typeParam);
  if (!itemType) notFound();

  const item = await getMobileEditorialReviewItem(itemType, id);
  if (!item) notFound();

  return (
    <section>
      <Link className="detail-back" href="/review">← Zurück zur Review Queue</Link>
      <header className="section-header review-header">
        <div className="strich" aria-hidden="true" />
        <p className="mono-label">{item.label}</p>
        <h1 className="focus-title">{item.title}</h1>
        <p className="lead">{item.description}</p>
      </header>
      <EditorialReviewDetail item={item} />
    </section>
  );
}
