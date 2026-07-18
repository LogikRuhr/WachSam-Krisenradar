"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { approveAndPublishItem, rejectItem } from "@/lib/admin/editorial";
import { parseEditorialType } from "@/lib/admin/editorial-read";

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
