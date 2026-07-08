import { z } from "zod";

/** Feedback-Kategorien — Single Source für Schema, Widget und Admin-Anzeige. */
export const FEEDBACK_CATEGORIES = ["lob", "problem", "idee", "datenfehler", "sonstiges"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  lob: "Lob",
  problem: "Problem",
  idee: "Idee",
  datenfehler: "Datenfehler",
  sonstiges: "Sonstiges",
};

const feedbackInputSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES).optional(),
  message: z.string().trim().min(3).max(4000),
  pagePath: z.string().trim().max(512).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  // Honeypot: für Menschen unsichtbar; gefüllt ⇒ Bot.
  website: z.string().optional(),
});

export type FeedbackData = {
  category: FeedbackCategory;
  message: string;
  pagePath?: string;
  rating?: number;
};

export type FeedbackParseResult = { ok: true; data: FeedbackData } | { ok: false; error: string };

/**
 * Validiert und normalisiert eine Feedback-Eingabe. Reine Funktion (keine DB):
 * setzt den Kategorie-Default, prüft das Honeypot und lässt leere Optionalfelder
 * fallen. Kontaktfelder gehören nicht zum aktiven Feedback-Datenmodell.
 */
export function parseFeedbackInput(raw: unknown): FeedbackParseResult {
  const parsed = feedbackInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Eingabe ist ungültig." };
  }

  const { website, category, message, pagePath, rating } = parsed.data;
  if (website && website.trim().length > 0) {
    return { ok: false, error: "Spam erkannt." };
  }

  return {
    ok: true,
    data: {
      category: category ?? "sonstiges",
      message,
      pagePath: pagePath || undefined,
      rating,
    },
  };
}
