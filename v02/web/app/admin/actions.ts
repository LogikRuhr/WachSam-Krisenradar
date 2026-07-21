"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  approveItem,
  createDraft,
  publishItem,
  rejectItem,
  unpublishItem,
  updateDraft,
} from "@/lib/admin/editorial";
import { getTypeMeta, parseEditorialType, type AdminFieldMeta } from "@/lib/admin/editorial-read";
import type { EditorialItemType } from "@/lib/admin/schemas";

export type AdminFormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

function parseJsonField(field: AdminFieldMeta, raw: string, fieldErrors: Record<string, string>) {
  if (!raw.trim()) {
    if (field.required) fieldErrors[field.name] = "Dieses JSON-Feld ist erforderlich.";
    return undefined;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    fieldErrors[field.name] = "Ungültiges JSON.";
    return undefined;
  }
}

function formErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const fieldName = String(issue.path[0] ?? "form");
    if (!fieldErrors[fieldName]) fieldErrors[fieldName] = issue.message;
  }
  return fieldErrors;
}

function parsePayload(itemType: EditorialItemType, formData: FormData) {
  const meta = getTypeMeta(itemType);
  const payload: Record<string, unknown> = {};
  const fieldErrors: Record<string, string> = {};

  for (const field of meta.fields) {
    const rawValue = formData.get(field.name);
    const value = typeof rawValue === "string" ? rawValue : "";

    if (field.kind === "json") {
      const parsed = parseJsonField(field, value, fieldErrors);
      if (parsed !== undefined) payload[field.name] = parsed;
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      if (field.required) fieldErrors[field.name] = "Dieses Feld ist erforderlich.";
      else payload[field.name] = null;
      continue;
    }
    payload[field.name] = trimmed;
  }

  return { payload, fieldErrors };
}

export async function saveEditorialItem(
  itemTypeValue: string,
  mode: "create" | "update",
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const itemType = parseEditorialType(itemTypeValue);
  if (!itemType) return { ok: false, message: "Unbekannter Datentyp." };

  const { payload, fieldErrors } = parsePayload(itemType, formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Bitte Eingaben prüfen.", fieldErrors };
  }

  let savedId: string;
  try {
    const result = mode === "create" ? await createDraft(itemType, payload) : await updateDraft(itemType, payload);
    savedId = result.id;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        message: "Bitte Eingaben prüfen.",
        fieldErrors: formErrorsFromZod(error),
      };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Speichern fehlgeschlagen.",
    };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/${itemType}`);
  revalidatePath(`/admin/${itemType}/${savedId}`);
  redirect(`/admin/${itemType}`);
}

export async function approveEditorialItem(itemTypeValue: string, formData: FormData) {
  const itemType = parseEditorialType(itemTypeValue);
  const id = String(formData.get("id") ?? "");
  if (!itemType || !id) return;
  await approveItem(itemType, id);
  revalidatePath("/admin");
  revalidatePath(`/admin/${itemType}`);
  revalidatePath(`/admin/${itemType}/${id}`);
  redirect(`/admin/${itemType}`);
}

export async function rejectEditorialItem(itemTypeValue: string, formData: FormData) {
  const itemType = parseEditorialType(itemTypeValue);
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!itemType || !id) return;
  await rejectItem(itemType, id, { reason });
  revalidatePath("/admin");
  revalidatePath(`/admin/${itemType}`);
  revalidatePath(`/admin/${itemType}/${id}`);
  redirect(`/admin/${itemType}`);
}

export async function publishEditorialItem(itemTypeValue: string, formData: FormData) {
  const itemType = parseEditorialType(itemTypeValue);
  const id = String(formData.get("id") ?? "");
  if (!itemType || !id) return;
  if (itemType === "nationalState") {
    throw new Error("Der Gesamtstand wird ausschließlich über die Review mit ausdrücklicher Bestätigung veröffentlicht.");
  }
  await publishItem(itemType, id);
  revalidatePath("/admin");
  revalidatePath(`/admin/${itemType}`);
  revalidatePath(`/admin/${itemType}/${id}`);
  redirect(`/admin/${itemType}`);
}

export async function unpublishEditorialItem(itemTypeValue: string, formData: FormData) {
  const itemType = parseEditorialType(itemTypeValue);
  const id = String(formData.get("id") ?? "");
  if (!itemType || !id) return;
  await unpublishItem(itemType, id);
  revalidatePath("/admin");
  revalidatePath(`/admin/${itemType}`);
  revalidatePath(`/admin/${itemType}/${id}`);
  redirect(`/admin/${itemType}`);
}
