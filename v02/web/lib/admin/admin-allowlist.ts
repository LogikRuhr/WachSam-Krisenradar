/**
 * Operator allowlist for automatic admin promotion.
 *
 * `ADMIN_EMAILS` is a comma-separated list of login addresses that should gain
 * the `admin` role on sign-in (see `lib/auth.ts` `events.signIn`). Kept as a
 * pure, dependency-free module so the matching rules are unit-testable without
 * booting the Auth.js runtime or a DB connection.
 */

/** Parse `ADMIN_EMAILS` into a normalized (trimmed, lowercased) list. */
export function parseAdminEmails(raw: string | undefined | null): string[] {
  return (raw ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * True when `email` is on the `ADMIN_EMAILS` allowlist. Case-insensitive and
 * whitespace-tolerant on both sides. Empty/missing email or empty allowlist → false.
 */
export function isAllowlistedAdmin(
  email: string | undefined | null,
  raw: string | undefined | null,
): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return parseAdminEmails(raw).includes(normalized);
}
