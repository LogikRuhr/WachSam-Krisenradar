"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { approveAndPublishItem, rejectItem } from "@/lib/admin/editorial";
import { parseEditorialType } from "@/lib/admin/editorial-read";
import { hasRequiredReviewConfirmation } from "@/lib/admin/review-confirmation";

function parseReviewTarget(itemTypeValue: string, formData: FormData) {
  const itemType = parseEditorialType(itemTypeValue);
  const id = String(formData.get("id") ?? "").trim();
  if (!itemType || !id) return null;
  return { itemType, id };
}

function revalidateReview(itemType: string, id: string) {
  revalidatePath("/review");
  revalidatePath(`/review/${itemType}/${id}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/${itemType}`);
  revalidatePath(`/admin/${itemType}/${id}`);
}

export async function approveAndPublishReviewItem(itemTypeValue: string, formData: FormData) {
  const target = parseReviewTarget(itemTypeValue, formData);
  if (!target) return;
  if (!hasRequiredReviewConfirmation(target.itemType, formData.get("confirm-publish"))) {
    throw new Error("Der Gesamtstand muss vor der Veröffentlichung ausdrücklich bestätigt werden.");
  }
  await approveAndPublishItem(target.itemType, target.id);
  revalidateReview(target.itemType, target.id);
  redirect("/review");
}

export async function rejectReviewItem(itemTypeValue: string, formData: FormData) {
  const target = parseReviewTarget(itemTypeValue, formData);
  if (!target) return;
  const reason = String(formData.get("reason") ?? "");
  await rejectItem(target.itemType, target.id, { reason });
  revalidateReview(target.itemType, target.id);
  redirect("/review");
}
