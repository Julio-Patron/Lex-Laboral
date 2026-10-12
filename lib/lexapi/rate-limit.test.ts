import { afterEach, describe, expect, it } from 'vitest';
import { allowRequest, resetRateLimitForTests } from './rate-limit';

afterEach(() => {
  resetRateLimitForTests();
});

describe('allowRequest', () => {
  it('allows the first 10 requests from an IP in 60 seconds', () => {
    const now = 1_000_000;
    for (let i = 0; i < 10; i += 1) {
      expect(allowRequest('1.1.1.1', now).ok).toBe(true);
    }
  });

  it('rejects the 11th request from the same IP with Retry-After', () => {
    const now = 1_000_000;
    for (let i = 0; i < 10; i += 1) {
      allowRequest('1.1.1.1', now);
    }

    const blocked = allowRequest('1.1.1.1', now);
    expect(blocked.ok).toBe(false);
    if (blocked.ok === false) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
      expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
    }
  });

  it('tracks IPs independently', () => {
    const now = 1_000_000;
    for (let i = 0; i < 10; i += 1) {
      allowRequest('1.1.1.1', now);
    }
    expect(allowRequest('8.8.8.8', now).ok).toBe(true);
  });
});
