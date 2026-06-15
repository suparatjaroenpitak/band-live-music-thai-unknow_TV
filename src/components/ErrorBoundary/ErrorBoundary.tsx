import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Smart Music Studio crashed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-studio-ink p-6 text-slate-100">
          <section className="max-w-md rounded-lg border border-red-400/30 bg-red-950/30 p-6">
            <h1 className="text-xl font-semibold">Smart Music Studio stopped</h1>
            <p className="mt-3 text-sm text-red-100">
              Refresh the app to restart the audio workspace. Your saved project data remains in this browser.
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
