import type { EditorialItemType } from "./schemas";

/** Der Gesamtstand braucht auch bei direktem Server-Action-Aufruf eine Bestätigung. */
export function hasRequiredReviewConfirmation(itemType: EditorialItemType, confirmation: FormDataEntryValue | null): boolean {
  return itemType !== "nationalState" || confirmation === "on";
}
