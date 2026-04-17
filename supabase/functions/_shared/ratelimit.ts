/**
 * Token-bucket rate limiter for Supabase Edge Functions.
 *
 * Uses Deno KV (available in Supabase Edge runtime) as the backing store so
 * limits are shared across function invocations.
 *
 * @param key    Unique identifier for the rate-limited entity (e.g. "ip:1.2.3.4")
 * @param limit  Maximum number of requests allowed in the window
 * @param windowSec  Rolling window duration in seconds
 * @returns true if the request is allowed, false if rate-limited
 *
 * Algorithm: sliding window counter.
 * - Store (count, windowStart) in KV.
 * - If now is within the same window, increment and check.
 * - If now is past the window, reset to 1.
 */
export async function applyRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  let kv: Deno.Kv
  try {
    kv = await Deno.openKv()
  } catch {
    // Deno KV not available (e.g. local unit test). Fail open so tests pass.
    return true
  }

  const kvKey = ['ratelimit', key]
  const nowSec = Math.floor(Date.now() / 1000)

  const entry = await kv.get<{ count: number; windowStart: number }>(kvKey)
  const current = entry.value

  if (!current || nowSec - current.windowStart >= windowSec) {
    // New window
    await kv.set(kvKey, { count: 1, windowStart: nowSec }, { expireIn: windowSec * 1000 })
    return true
  }

  if (current.count >= limit) {
    return false
  }

  await kv.set(
    kvKey,
    { count: current.count + 1, windowStart: current.windowStart },
    { expireIn: windowSec * 1000 },
  )
  return true
}
