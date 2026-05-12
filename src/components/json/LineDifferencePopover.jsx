import { X } from "lucide-react";
import { diffLabel } from "../../lib/ui";

export function LineDifferencePopover({ differences, lineNumber, onClose }) {
  return (
    <div className="absolute left-14 top-4 z-30 w-[min(28rem,calc(100%-4.5rem))] rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-950 shadow-2xl">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Line {lineNumber}</p>
          <p className="mt-1 text-xs text-rose-700">
            {differences.length} difference
            {differences.length === 1 ? "" : "s"} on this line
          </p>
        </div>
        <button
          aria-label="Close line difference popup"
          className="inline-flex h-7 w-7 items-center justify-center rounded text-rose-800 transition hover:bg-rose-100"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>
      <ul className="max-h-56 space-y-2 overflow-auto text-xs">
        {differences.map((difference) => (
          <li
            className="rounded-md border border-rose-200 bg-white/70 p-2"
            key={`${difference.path}-${difference.type}`}
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded bg-rose-100 px-1.5 py-0.5 font-semibold uppercase text-rose-800">
                {diffLabel(difference.type)}
              </span>
              <span className="break-all font-mono text-rose-900">
                {difference.path}
              </span>
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              <code className="break-all rounded bg-rose-100 px-2 py-1 font-mono text-rose-950">
                Source: {difference.source}
              </code>
              <code className="break-all rounded bg-rose-100 px-2 py-1 font-mono text-rose-950">
                Target: {difference.target}
              </code>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
