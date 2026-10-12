import type { SearchResult } from './types';

const TTL_MS = 60_000;

interface CacheEntry {
  value: SearchResult[];
  storedAt: number;
}

const store = new Map<string, CacheEntry>();

export function resetCacheForTests(): void {
  store.clear();
}

export function cacheKey(query: string, norm: string): string {
  return `${norm}::${query}`;
}

export function cacheSet(key: string, value: SearchResult[], now: number = Date.now()): void {
  store.set(key, { value, storedAt: now });
}

export function cacheGet(key: string, now: number = Date.now()): SearchResult[] | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (now - entry.storedAt >= TTL_MS) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}
