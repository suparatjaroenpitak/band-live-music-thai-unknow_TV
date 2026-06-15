export function createRateLimiter(limit: number, windowMs: number) {
  const timestamps: number[] = [];

  return function canRun(now = Date.now()) {
    while (timestamps.length > 0 && now - timestamps[0] > windowMs) {
      timestamps.shift();
    }

    if (timestamps.length >= limit) {
      return false;
    }

    timestamps.push(now);
    return true;
  };
}
