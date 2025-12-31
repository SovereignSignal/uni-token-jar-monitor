// Server-side in-memory cache for fast responses
// Data is cached and refreshed in the background

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ServerCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  get<T>(key: string): { data: T; timestamp: number } | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    
    // Return data even if expired (stale-while-revalidate pattern)
    return { data: entry.data, timestamp: entry.timestamp };
  }

  isExpired(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const serverCache = new ServerCache();

// Cache keys
export const CACHE_KEYS = {
  TOKEN_BALANCES: "token_balances",
  PROFITABILITY_DATA: "profitability_data",
  BURN_HISTORY: "burn_history",
} as const;

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
  TOKEN_BALANCES: 5 * 60 * 1000, // 5 minutes - balances don't change frequently
  PROFITABILITY_DATA: 2 * 60 * 1000, // 2 minutes - includes prices
  BURN_HISTORY: 10 * 60 * 1000, // 10 minutes - historical data rarely changes
} as const;
