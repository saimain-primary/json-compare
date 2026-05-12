import { diffBadgeClass, diffLabel } from "../../lib/ui";

export function DifferencesDialog({
  differences,
  hasSelectedCompareOption,
  onClose,
}) {
  return (
    <div
      aria-labelledby="diff-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-2 py-3 sm:px-4 sm:py-6"
      role="dialog"
    >
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-zinc-50 shadow-2xl sm:max-h-[86vh]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div>
            <h2
              className="text-lg font-semibold text-zinc-950"
              id="diff-dialog-title"
            >
              Differences
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {differences.length} difference
              {differences.length === 1 ? "" : "s"} found
            </p>
          </div>
          <button
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="overflow-auto">
          {differences.length === 0 ? (
            <p className="px-5 py-6 text-sm font-medium text-emerald-700">
              {hasSelectedCompareOption
                ? "No differences found for the selected compare options."
                : "Select at least one compare option to view differences."}
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200">
              {differences.map((difference, index) => (
                <li
                  className="grid gap-3 px-5 py-4 lg:grid-cols-[180px_1fr_1fr]"
                  key={`${difference.path}-${index}`}
                >
                  <div>
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold uppercase ${diffBadgeClass(
                        difference.type,
                      )}`}
                    >
                      {diffLabel(difference.type)}
                    </span>
                    <p className="mt-2 break-all font-mono text-xs text-zinc-600">
                      {difference.path}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      Source
                    </p>
                    <code className="block break-all rounded bg-zinc-100 px-3 py-2 font-mono text-sm text-zinc-800">
                      {difference.source}
                    </code>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      Target
                    </p>
                    <code className="block break-all rounded bg-zinc-100 px-3 py-2 font-mono text-sm text-zinc-800">
                      {difference.target}
                    </code>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
