/**
 * Einfacher In-Memory-Sliding-Window-Rate-Limiter (pro Prozess). Bewusst schlicht
 * (Simply First): genügt als Basis-Spam-Schutz auf einem Single-VPS. Kein Schutz
 * über mehrere Instanzen/Neustarts hinweg — dafür wäre ein geteilter Store nötig.
 * `now` ist injizierbar, damit das Zeitfenster testbar bleibt.
 */
export interface RateLimiter {
  check(key: string, now?: number): { allowed: boolean; remaining: number };
}

export function createRateLimiter({ max, windowMs }: { max: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    check(key, now = Date.now()) {
      const cutoff = now - windowMs;
      const recent = (hits.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
      if (recent.length >= max) {
        hits.set(key, recent);
        return { allowed: false, remaining: 0 };
      }
      recent.push(now);
      hits.set(key, recent);
      return { allowed: true, remaining: max - recent.length };
    },
  };
}
