const bucket = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 24 * 60 * 60 * 1000;
const DAILY_LIMIT = 150;

export function checkDailyLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const current = bucket.get(userId);

  if (!current || now - current.windowStart > WINDOW_MS) {
    bucket.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }

  if (current.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  return { allowed: true, remaining: Math.max(0, DAILY_LIMIT - current.count) };
}


