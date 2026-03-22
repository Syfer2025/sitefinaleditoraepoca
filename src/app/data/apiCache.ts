/**
 * In-memory request deduplication with TTL.
 * Same-key requests share one Promise; results are cached for `ttl` ms.
 * Failed requests are evicted so they can be retried.
 */
interface CacheEntry {
  promise: Promise<unknown>;
  timestamp: number;
}

const _cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function dedupeRequest<T>(key: string, fetcher: () => Promise<T>, ttl = DEFAULT_TTL): Promise<T> {
  const now = Date.now();
  const entry = _cache.get(key);

  if (entry && now - entry.timestamp < ttl) {
    return entry.promise as Promise<T>;
  }

  const promise = fetcher().catch((err) => {
    _cache.delete(key);
    return Promise.reject(err);
  });

  _cache.set(key, { promise, timestamp: now });
  return promise;
}
