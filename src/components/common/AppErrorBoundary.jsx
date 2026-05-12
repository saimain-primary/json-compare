import { Component } from "react";
import { RotateCcw } from "lucide-react";

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[AppErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 text-zinc-950">
          <section className="max-w-md rounded-lg border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-rose-950">
              JSON preview paused
            </h1>
            <p className="mt-2 text-sm leading-6 text-rose-800">
              The preview hit a browser rendering limit. The editor data is not
              saved locally, so reloading restores the safe demo workspace.
            </p>
            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-rose-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 sm:w-auto"
              onClick={() => window.location.reload()}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={16} />
              Reload
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
