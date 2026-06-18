"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { FEEDBACK_CATEGORIES, FEEDBACK_CATEGORY_LABEL } from "@/lib/feedback";

type Status = "idle" | "sending" | "ok" | "error";

/**
 * Niedrigschwelliges In-App-Feedback. Anonym nutzbar; eingeloggte Nutzer werden
 * serverseitig zugeordnet. Honeypot-Feld + Server-Rate-Limit als Spam-Schutz.
 * Sendet JSON an /api/feedback; pagePath kommt aus dem aktuellen Pfad.
 */
export function FeedbackWidget() {
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const ratingRaw = String(data.get("rating") ?? "");
    const payload = {
      category: String(data.get("category") ?? "sonstiges"),
      message: String(data.get("message") ?? ""),
      contactEmail: String(data.get("contactEmail") ?? ""),
      rating: ratingRaw ? Number(ratingRaw) : undefined,
      website: String(data.get("website") ?? ""),
      pagePath: pathname,
    };

    setStatus("sending");
    setError(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: { ok?: boolean; error?: string } = await response.json().catch(() => ({}));
      if (response.ok && json.ok) {
        setStatus("ok");
        form.reset();
      } else {
        setStatus("error");
        setError(json.error ?? "Senden fehlgeschlagen. Bitte später erneut.");
      }
    } catch {
      setStatus("error");
      setError("Netzwerkfehler. Bitte später erneut versuchen.");
    }
  }

  return (
    <details className="feedback-widget">
      <summary className="feedback-summary">Feedback geben</summary>
      <div className="feedback-panel">
        {status === "ok" ? (
          <p className="feedback-success" role="status">
            Danke für dein Feedback — es hilft, WachSam zu verbessern.
          </p>
        ) : (
          <form className="feedback-form" onSubmit={onSubmit} aria-label="Feedback-Formular">
            <label htmlFor="fb-category">Kategorie</label>
            <select id="fb-category" name="category" className="input-mono" defaultValue="sonstiges">
              {FEEDBACK_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {FEEDBACK_CATEGORY_LABEL[category]}
                </option>
              ))}
            </select>

            <label htmlFor="fb-message">Dein Feedback</label>
            <textarea
              id="fb-message"
              name="message"
              className="input-mono"
              rows={4}
              required
              minLength={3}
              maxLength={4000}
            />

            <label htmlFor="fb-rating">Bewertung (optional)</label>
            <select id="fb-rating" name="rating" className="input-mono" defaultValue="">
              <option value="">– keine –</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <label htmlFor="fb-email">E-Mail für Rückfragen (optional, freiwillig)</label>
            <input
              id="fb-email"
              name="contactEmail"
              type="email"
              className="input-mono"
              autoComplete="email"
              maxLength={240}
            />

            {/* Honeypot — für Menschen unsichtbar, fängt Bots ab. */}
            <div className="feedback-hp" aria-hidden="true">
              <label htmlFor="fb-website">Website (bitte leer lassen)</label>
              <input id="fb-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <p className="feedback-hint mono-label">
              Bitte keine sensiblen oder Gesundheitsdaten angeben. Die E-Mail ist freiwillig und wird
              nur für eine mögliche Rückfrage genutzt.
            </p>

            {status === "error" && error ? (
              <p className="feedback-error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn-primary" disabled={status === "sending"}>
              {status === "sending" ? "Senden …" : "Feedback senden"}
            </button>
          </form>
        )}
      </div>
    </details>
  );
}
