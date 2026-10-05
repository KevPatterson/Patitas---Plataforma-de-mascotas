type Bucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  patitasRateLimit?: Map<string, Bucket>;
};

const store = globalForRateLimit.patitasRateLimit ?? new Map<string, Bucket>();
globalForRateLimit.patitasRateLimit = store;

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  store.set(key, bucket);

  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}