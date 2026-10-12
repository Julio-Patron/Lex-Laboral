import type { RateLimitDecision } from './types';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const hits = new Map<string, number[]>();

export function resetRateLimitForTests(): void {
  hits.clear();
}

export function allowRequest(ip: string, now: number = Date.now()): RateLimitDecision {
  const windowStart = now - WINDOW_MS;
  const recent = (hits.get(ip) ?? []).filter((ts) => ts > windowStart);

  if (recent.length >= MAX_REQUESTS) {
    const retryAfterMs = recent[0] + WINDOW_MS - now;
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  recent.push(now);
  hits.set(ip, recent);
  return { ok: true };
}
