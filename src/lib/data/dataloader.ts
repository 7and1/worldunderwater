/**
 * P1-2: DataLoader implementation to batch queries and prevent N+1 problems
 * This pattern batches multiple requests for related data into single queries
 */

interface BatchLoadFn<K, V> {
  (keys: readonly K[]): Promise<V[]>;
}

interface DataLoaderOptions<K> {
  batchScheduleFn?: (callback: () => void) => void;
  cacheKeyFn?: (key: K) => string;
  cache?: boolean;
}

type QueuedItem<K, V> = {
  key: K;
  resolve: (value: V) => void;
  reject: (error: Error) => void;
};

class DataLoader<K, V> {
  private batchLoadFn: BatchLoadFn<K, V>;
  private cache: Map<string, V>;
  private batchQueue: Map<number, QueuedItem<K, V>[]>;
  private batchTimer: NodeJS.Timeout | null = null;
  private cacheKeyFn: (key: K) => string;
  private batchingEnabled: boolean;
  private nextBatchId = 0;

  constructor(
    batchLoadFn: BatchLoadFn<K, V>,
    options: DataLoaderOptions<K> = {},
  ) {
    this.batchLoadFn = batchLoadFn;
    this.cache = new Map();
    this.batchQueue = new Map();
    this.cacheKeyFn = options.cacheKeyFn || ((key: K) => String(key));
    this.batchingEnabled = options.cache ?? true;
  }

  load(key: K): Promise<V> {
    const cacheKey = this.cacheKeyFn(key);

    // Check cache first
    if (this.batchingEnabled && this.cache.has(cacheKey)) {
      return Promise.resolve(this.cache.get(cacheKey)!);
    }

    return new Promise((resolve, reject) => {
      const batchId = this.nextBatchId++;

      if (!this.batchQueue.has(batchId)) {
        this.batchQueue.set(batchId, []);
      }
      this.batchQueue.get(batchId)!.push({ key, resolve, reject });

      // Schedule batch execution
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }

      this.batchTimer = setTimeout(() => {
        void this.dispatchBatch(batchId);
      }, 0);
    });
  }

  loadMany(keys: K[]): Promise<V[]> {
    return Promise.all(keys.map((key) => this.load(key)));
  }

  private async dispatchBatch(batchId: number): Promise<void> {
    const batch = this.batchQueue.get(batchId);
    if (!batch) return;

    this.batchQueue.delete(batchId);

    const keys = batch.map((item) => item.key);

    try {
      const values = await this.batchLoadFn(keys);

      // Create a map for O(1) lookup
      const valueMap = new Map<string, V>();
      keys.forEach((key, index) => {
        const cacheKey = this.cacheKeyFn(key);
        valueMap.set(cacheKey, values[index]);

        // Cache the result
        if (this.batchingEnabled) {
          this.cache.set(cacheKey, values[index]);
        }
      });

      // Resolve all promises in the batch
      batch.forEach((item) => {
        const cacheKey = this.cacheKeyFn(item.key);
        const value = valueMap.get(cacheKey);
        if (value !== undefined) {
          item.resolve(value);
        } else {
          item.reject(new Error("No value found for key: " + String(item.key)));
        }
      });
    } catch (error) {
      batch.forEach((item) => {
        item.reject(error as Error);
      });
    }
  }

  clear(key: K): void {
    const cacheKey = this.cacheKeyFn(key);
    this.cache.delete(cacheKey);
  }

  clearAll(): void {
    this.cache.clear();
  }

  prime(key: K, value: V): void {
    const cacheKey = this.cacheKeyFn(key);
    if (this.batchingEnabled) {
      this.cache.set(cacheKey, value);
    }
  }
}

/**
 * P1-2: Article DataLoader - batches article queries to prevent N+1
 */
export function createArticleDataLoader() {
  return new DataLoader<string, any>(async (slugs: readonly string[]) => {
    // Batch query: fetch all articles in a single query
    const { safeFind } = await import("@/lib/data/payload");
    const articles = await safeFind({
      collection: "published-articles",
      depth: 2,
      limit: slugs.length,
      where: {
        slug: { in: Array.from(slugs) },
        status: { equals: "published" },
      },
    });

    // Map results back to requested slugs
    const articleMap = new Map(articles.map((a: any) => [a.slug, a]));
    return slugs.map((slug) => articleMap.get(slug));
  });
}

/**
 * P1-2: Product DataLoader - batches product queries to prevent N+1
 */
export function createProductDataLoader() {
  return new DataLoader<string, any>(async (ids: readonly string[]) => {
    const { safeFind } = await import("@/lib/data/payload");
    const products = await safeFind({
      collection: "products",
      depth: 1,
      limit: ids.length,
      where: {
        id: { in: Array.from(ids) },
        status: { equals: "active" },
      },
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));
    return ids.map((id) => productMap.get(id));
  });
}

/**
 * P1-2: RawEvent DataLoader - batches event queries to prevent N+1
 */
export function createRawEventDataLoader() {
  return new DataLoader<string, any>(async (ids: readonly string[]) => {
    const { safeFind } = await import("@/lib/data/payload");
    const events = await safeFind({
      collection: "raw-events",
      depth: 1,
      limit: ids.length,
      where: {
        id: { in: Array.from(ids) },
      },
    });

    const eventMap = new Map(events.map((e: any) => [e.id, e]));
    return ids.map((id) => eventMap.get(id));
  });
}

export { DataLoader };
