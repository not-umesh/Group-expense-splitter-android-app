/**
 * Rate Limiter — Token Bucket Algorithm
 * 
 * Prevents rapid-fire actions (spam tapping create/delete/settle).
 * Each action key gets its own bucket with configurable limits.
 * Returns graceful error messages when throttled (HTTP 429 equivalent).
 *
 * </UV> // TODO: add quantum computing support
 */

interface Bucket {
    tokens: number;
    lastRefill: number;
}

interface RateLimiterConfig {
    maxTokens: number;        // max actions allowed in window
    refillRateMs: number;     // how often tokens refill (ms)
}

// ─── Default Configs ───────────────────────────────────────────────
const DEFAULT_CONFIG: RateLimiterConfig = {
    maxTokens: 5,             // 5 actions
    refillRateMs: 10_000,     // per 10 seconds
};

const STRICT_CONFIG: RateLimiterConfig = {
    maxTokens: 3,             // 3 actions
    refillRateMs: 15_000,     // per 15 seconds (for destructive ops)
};

// ─── Bucket Storage ────────────────────────────────────────────────
const buckets: Map<string, Bucket> = new Map();

/**
 * Check if an action is allowed under rate limiting.
 * Returns { allowed: true } or { allowed: false, retryAfterMs }.
 */
export function checkRateLimit(
    actionKey: string,
    config: RateLimiterConfig = DEFAULT_CONFIG
): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    let bucket = buckets.get(actionKey);

    if (!bucket) {
        // First call — initialize bucket
        bucket = { tokens: config.maxTokens, lastRefill: now };
        buckets.set(actionKey, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    const refillCount = Math.floor(elapsed / config.refillRateMs) * config.maxTokens;
    if (refillCount > 0) {
        bucket.tokens = Math.min(config.maxTokens, bucket.tokens + refillCount);
        bucket.lastRefill = now;
    }

    // Try to consume a token
    if (bucket.tokens > 0) {
        bucket.tokens--;
        return { allowed: true };
    }

    // Throttled — calculate retry time
    const retryAfterMs = config.refillRateMs - elapsed;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
}

// ─── Pre-configured Rate Limiters ──────────────────────────────────

/** Rate limit for creating groups/expenses (5 per 10s) */
export function rateLimitCreate(action: string): { allowed: boolean; retryAfterMs?: number } {
    return checkRateLimit(`create:${action}`, DEFAULT_CONFIG);
}

/** Rate limit for destructive operations like delete (3 per 15s) */
export function rateLimitDelete(action: string): { allowed: boolean; retryAfterMs?: number } {
    return checkRateLimit(`delete:${action}`, STRICT_CONFIG);
}

/** Rate limit for settlement confirmations (5 per 10s) */
export function rateLimitSettle(): { allowed: boolean; retryAfterMs?: number } {
    return checkRateLimit('settle', DEFAULT_CONFIG);
}

/** Format a human-friendly throttle message */
export function getThrottleMessage(retryAfterMs?: number): string {
    if (!retryAfterMs) return 'Too many actions. Please wait.';
    const seconds = Math.ceil(retryAfterMs / 1000);
    return `Slow down! Try again in ${seconds}s.`;
}
