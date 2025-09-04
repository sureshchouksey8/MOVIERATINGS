type Entry<T> = { value: T; expires: number };
const MAX = 500;

class LruTTL {
  private map = new Map<string, Entry<any>>();

  get<T>(key: string): T | undefined {
    const e = this.map.get(key);
    if (!e) return;
    if (Date.now() > e.expires) { this.map.delete(key); return; }
    // refresh recency
    this.map.delete(key); this.map.set(key, e);
    return e.value as T;
  }
  set<T>(key: string, value: T, ttlMs: number) {
    if (this.map.size >= MAX) {
      // delete oldest
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
    }
    this.map.set(key, { value, expires: Date.now() + ttlMs });
  }
}

export const lru = new LruTTL();