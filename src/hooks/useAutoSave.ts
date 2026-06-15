import { useEffect } from "react";
import { useStudioStore } from "../store/useStudioStore";

export function useAutoSave() {
  const markSaved = useStudioStore((state) => state.markSaved);

  useEffect(() => {
    const interval = window.setInterval(() => {
      markSaved();
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [markSaved]);
}
