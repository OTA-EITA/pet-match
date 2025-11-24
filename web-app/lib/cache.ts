interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;

    // Cleanup expired entries every minute
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Remove expired entries
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Get cache statistics
  getStats(): {
    size: number;
    keys: string[];
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const entries = Array.from(this.cache.entries());
    const timestamps = entries.map(([, entry]) => entry.timestamp);

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }
}

// Create a singleton instance
export const cache = new CacheManager();

// Helper function to create cache keys
export function createCacheKey(endpoint: string, params?: Record<string, any>): string {
  if (!params) {
    return endpoint;
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${JSON.stringify(params[key])}`)
    .join('&');

  return `${endpoint}?${sortedParams}`;
}

// Decorator function for caching API responses
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  // Fetch and cache
  return fetcher().then((data) => {
    cache.set(key, data, ttl);
    return data;
  });
}

// Cache invalidation patterns
export const cacheInvalidation = {
  // Invalidate all caches matching a pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keys = cache.getStats().keys;

    keys.forEach((key) => {
      if (regex.test(key)) {
        cache.delete(key);
      }
    });
  },

  // Invalidate all pet-related caches
  invalidatePets(): void {
    this.invalidatePattern('^/v1/pets');
  },

  // Invalidate all favorite-related caches
  invalidateFavorites(): void {
    this.invalidatePattern('^/v1/favorites');
  },

  // Invalidate all inquiry-related caches
  invalidateInquiries(): void {
    this.invalidatePattern('^/v1/inquiries');
  },

  // Invalidate all application-related caches
  invalidateApplications(): void {
    this.invalidatePattern('^/v1/applications');
  },

  // Invalidate user profile cache
  invalidateProfile(): void {
    this.invalidatePattern('^/auth/profile');
  },
};
