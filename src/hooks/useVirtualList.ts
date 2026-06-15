import { useMemo } from "react";

interface VirtualListOptions {
  itemCount: number;
  itemHeight: number;
  viewportHeight: number;
  scrollTop: number;
  overscan?: number;
}

export function useVirtualList({ itemCount, itemHeight, viewportHeight, scrollTop, overscan = 3 }: VirtualListOptions) {
  return useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2;
    const end = Math.min(itemCount, start + visibleCount);

    return {
      start,
      end,
      totalHeight: itemCount * itemHeight,
      offsetY: start * itemHeight,
      indexes: Array.from({ length: end - start }, (_, index) => start + index)
    };
  }, [itemCount, itemHeight, overscan, scrollTop, viewportHeight]);
}
