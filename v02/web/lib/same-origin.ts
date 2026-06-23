/**
 * Same-Origin-Helfer für POST-Endpoints (leichtgewichtiger CSRF-Schutz).
 * Reine, testbare Funktionen — keine Request-Abhängigkeit.
 *
 * Wichtig hinter einem Reverse-Proxy (Traefik): `request.url` trägt den INTERNEN
 * Host (z. B. web:3000), nicht den öffentlichen. Der erwartete Host muss daher aus
 * dem vom Proxy gesetzten `x-forwarded-host` (bzw. `host`) abgeleitet werden, sonst
 * scheitert ein legitimer Browser-POST mit korrektem Origin am Host-Vergleich.
 */

export function resolveExpectedHost(headers: {
  forwardedHost: string | null;
  host: string | null;
  fallbackUrl: string;
}): string | null {
  const forwarded = headers.forwardedHost?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const host = headers.host?.trim();
  if (host) return host;
  try {
    return new URL(headers.fallbackUrl).host;
  } catch {
    return null;
  }
}

/**
 * true, wenn der Request als same-origin gelten darf. Fehlt der Origin-Header
 * (z. B. bei same-origin-Navigationen), wird nicht blockiert. Ein gesetzter Origin
 * muss im Host mit `expectedHost` übereinstimmen.
 */
export function isSameOrigin(origin: string | null, expectedHost: string | null): boolean {
  if (!origin) return true;
  if (!expectedHost) return false;
  try {
    return new URL(origin).host === expectedHost;
  } catch {
    return false;
  }
}
