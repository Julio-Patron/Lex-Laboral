import { afterEach, describe, expect, it } from 'vitest';
import { cacheGet, cacheKey, cacheSet, resetCacheForTests } from './cache';
import type { SearchResult } from './types';

const sample: SearchResult[] = [
  {
    score: 100,
    snippet: 'texto',
    metadata: { norm: 'LFT', title: 'Ley Federal del Trabajo', article: '47', num: 47 },
  },
];

afterEach(() => {
  resetCacheForTests();
});

describe('search cache', () => {
  it('returns a stored result within 60 seconds', () => {
    const key = cacheKey('despido', 'lft');
    cacheSet(key, sample, 1_000);
    expect(cacheGet(key, 30_000)).toEqual(sample);
  });

  it('misses after 60 seconds', () => {
    const key = cacheKey('despido', 'lft');
    cacheSet(key, sample, 1_000);
    expect(cacheGet(key, 62_000)).toBeUndefined();
  });

  it('keys query and norm together', () => {
    expect(cacheKey('despido', 'lft')).not.toBe(cacheKey('despido', 'lss'));
    expect(cacheKey('despido', 'lft')).not.toBe(cacheKey('aguinaldo', 'lft'));
  });
});
