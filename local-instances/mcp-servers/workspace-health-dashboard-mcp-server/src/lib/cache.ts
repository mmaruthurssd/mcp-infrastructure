/**
 * Simple in-memory cache with TTL
 * Prevents excessive calls to other MCPs
 */

import { CacheEntry } from '../types/index.js';

const cache = new Map<string, CacheEntry<any>>();

const DEFAULT_TTL = 60000; // 60 seconds

export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }

  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    value,
    timestamp: Date.now(),
    ttl,
  });
}

export function cacheInvalidate(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }

  const keys = Array.from(cache.keys());
  for (const key of keys) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
