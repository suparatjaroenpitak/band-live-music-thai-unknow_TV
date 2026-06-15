import { useRef } from "react";
import { createRateLimiter } from "../utils/rateLimit";

export function useStableRateLimiter(limit: number, windowMs: number) {
  const ref = useRef<ReturnType<typeof createRateLimiter> | null>(null);
  if (!ref.current) ref.current = createRateLimiter(limit, windowMs);
  return ref.current;
}
