import { lazy, Suspense } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";

const StudioPage = lazy(() => import("./pages/StudioPage"));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <main className="grid min-h-screen place-items-center bg-studio-ink text-slate-100">
            <div className="rounded-lg border border-studio-line bg-studio-panel px-5 py-4 text-sm shadow-glow">
              Loading Smart Music Studio
            </div>
          </main>
        }
      >
        <StudioPage />
      </Suspense>
    </ErrorBoundary>
  );
}
