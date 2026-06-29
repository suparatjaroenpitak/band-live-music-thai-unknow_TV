import { ChevronDown, ChevronUp } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}
      style={{ willChange: "contents" }}
    >
      <div className="mx-auto max-w-7xl">
        <div
          className="relative flex flex-col items-stretch rounded-t-xl border border-b-0 border-white/10 bg-[#0a0e17]/95 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] backdrop-blur-md"
          style={{
            maxHeight: collapsed ? "32px" : "140px",
            overflow: "hidden",
            transition: "max-height 0.25s ease-in-out",
          }}
        >
          <button
            onClick={toggle}
            className="relative z-10 flex h-8 shrink-0 items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
            type="button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Show ad banner" : "Hide ad banner"}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{collapsed ? "Show Ad" : "Hide Ad"}</span>
          </button>

          <div
            className="flex items-center justify-center px-4 pb-3 pt-1"
            style={{
              opacity: collapsed ? 0 : 1,
              transform: collapsed ? "translateY(10px)" : "translateY(0)",
              transition: "opacity 0.2s ease, transform 0.2s ease",
              pointerEvents: collapsed ? "none" : "auto",
            }}
          >
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
  );
});
