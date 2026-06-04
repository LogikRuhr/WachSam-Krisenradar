import "server-only";

import { getHouseholdByUserId, type HouseholdHeizart, type HouseholdModus } from "@/lib/profile";
import { auth, isAuthRuntimeConfigured } from "@/lib/auth";

export type UserProfile = {
  modus: HouseholdModus | null;
  plz: string | null;
  heizart: HouseholdHeizart | null;
};

export async function getCurrentUserModus(): Promise<HouseholdModus | null> {
  if (!isAuthRuntimeConfigured()) return null;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const household = await getHouseholdByUserId(userId);
  return household?.modus ?? null;
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  if (!isAuthRuntimeConfigured()) return { modus: null, plz: null, heizart: null };

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { modus: null, plz: null, heizart: null };

  const household = await getHouseholdByUserId(userId);
  if (!household) return { modus: null, plz: null, heizart: null };
  return {
    modus: household.modus ?? null,
    plz: household.plz ?? null,
    heizart: (household.heizart as HouseholdHeizart | null) ?? null,
  };
}
