import { ChevronDown, ChevronUp } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

interface AdBannerProps {
  className?: string;
}

const STORAGE_KEY = "ad-banner-collapsed";

export const AdBanner = memo(function AdBanner({ className = "" }: AdBannerProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const bannerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  useEffect(() => {
    const el = bannerRef.current;
    if (!el || collapsed) return;

    observerRef.current?.disconnect();
    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0 && el.style.minHeight !== `${h}px`) {
          el.style.minHeight = `${h}px`;
        }
      }
    });
    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [collapsed]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${className}`}
      style={{ willChange: "transform" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="relative flex flex-col items-stretch overflow-hidden rounded-t-xl border border-b-0 border-white/10 bg-[#0a0e17]/95 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <button
            onClick={toggle}
            className="flex h-8 items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
            type="button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Show ad banner" : "Hide ad banner"}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{collapsed ? "Show Ad" : "Hide Ad"}</span>
          </button>

          <div
            ref={bannerRef}
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: collapsed ? "0px" : "120px",
              opacity: collapsed ? 0 : 1,
            }}
          >
            <div className="flex min-h-[90px] items-center justify-center px-4 py-2">
              <div
                id="ad-banner-slot"
                className="flex h-[90px] w-full max-w-[728px] items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.03] text-xs text-slate-500"
              >
                <span className="pointer-events-none select-none">Advertisement Space (728 x 90)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
