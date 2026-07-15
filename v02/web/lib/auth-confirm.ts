/**
 * Rewrites an Auth.js magic-link callback URL so the mail links to the
 * confirmation page (`/login/confirm`) instead of the callback route itself.
 *
 * Email security scanners and tracking redirects (e.g. Resend click/open
 * tracking) pre-fetch links found in mails. If the mail linked directly to
 * `/api/auth/callback/resend`, that pre-fetch would consume the single-use
 * verification token before the human ever clicks it. Pointing the mail
 * link at `/login/confirm` defers the actual callback — and with it the
 * token consumption — to an explicit button click on that page.
 *
 * Only the pathname changes; origin and every query param (`token`, `email`,
 * `callbackUrl`, …) are carried over unmodified.
 */
export function buildConfirmUrl(magicLinkUrl: string): string {
  const url = new URL(magicLinkUrl);
  url.pathname = "/login/confirm";
  return url.toString();
}
