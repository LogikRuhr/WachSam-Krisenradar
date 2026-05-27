"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { households } from "@wachsam/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const modusValues = ["single", "familie", "selbststaendig", "rentner"] as const;
const profileSchema = z.object({
  modus: z.enum(modusValues, { message: "Bitte wähle einen gültigen Modus." }),
  plz: z.string().trim().regex(/^\d{5}$/, "Bitte gib eine gültige fünfstellige PLZ ein."),
});
const modusSchema = z.enum(modusValues, { message: "Bitte wähle einen gültigen Modus." });

export type Household = typeof households.$inferSelect;
export type HouseholdModus = (typeof modusValues)[number];
export type ProfileActionState = { ok: boolean; message: string | null };
export type UpdateHouseholdModusResult =
  | { ok: true; modus: HouseholdModus }
  | { ok: false; reason: "unauthorized" | "invalid_modus" | "no_database" | "no_household" };

export async function getHouseholdByUserId(userId: string): Promise<Household | null> {
  if (!db) return null;

  const rows = await db.select().from(households).where(eq(households.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function getCurrentHouseholdModusAction(): Promise<HouseholdModus | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !db) return null;

  const household = await getHouseholdByUserId(userId);
  return household?.modus ?? null;
}

export async function upsertHouseholdAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, message: "Bitte melde dich an, um dein Profil zu speichern." };
  }
  if (!db) {
    return { ok: false, message: "Datenbank nicht verbunden. Das Profil konnte nicht gespeichert werden." };
  }

  const parsed = profileSchema.safeParse({
    modus: formData.get("modus"),
    plz: String(formData.get("plz") ?? "").trim(),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Profilangaben sind ungültig." };
  }

  const existing = await getHouseholdByUserId(userId);
  const now = new Date();

  if (existing) {
    await db
      .update(households)
      .set({ modus: parsed.data.modus, plz: parsed.data.plz, updatedAt: now })
      .where(eq(households.id, existing.id));
  } else {
    await db.insert(households).values({
      id: randomUUID(),
      userId,
      modus: parsed.data.modus,
      plz: parsed.data.plz,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/profil");
  revalidatePath("/");
  return { ok: true, message: "Profil gespeichert." };
}

export async function updateHouseholdModusAction(modus: unknown): Promise<UpdateHouseholdModusResult> {
  const parsed = modusSchema.safeParse(modus);
  if (!parsed.success) return { ok: false, reason: "invalid_modus" };

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, reason: "unauthorized" };
  if (!db) return { ok: false, reason: "no_database" };

  const existing = await getHouseholdByUserId(userId);
  if (!existing) return { ok: false, reason: "no_household" };

  await db.update(households).set({ modus: parsed.data, updatedAt: new Date() }).where(eq(households.id, existing.id));
  revalidatePath("/");
  revalidatePath("/profil");

  return { ok: true, modus: parsed.data };
}
