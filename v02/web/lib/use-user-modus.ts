import "server-only";

import { getHouseholdByUserId, type HouseholdModus } from "@/lib/profile";
import { auth } from "@/lib/auth";

export async function getCurrentUserModus(): Promise<HouseholdModus | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const household = await getHouseholdByUserId(userId);
  return household?.modus ?? null;
}
