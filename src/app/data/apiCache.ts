/**
 * In-memory request deduplication.
 * If the same key is requested multiple times simultaneously,
 * only one real fetch is made — all callers share the same Promise.
 * Failed requests are evicted so they can be retried.
 */
const _cache = new Map<string, Promise<unknown>>();

export function dedupeRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (!_cache.has(key)) {
    _cache.set(
      key,
      fetcher().catch((err) => {
        _cache.delete(key);
        return Promise.reject(err);
      })
    );
  }
  return _cache.get(key) as Promise<T>;
}
