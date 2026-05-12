import { X } from "lucide-react";
import { IconButton } from "../common/IconButton";
import { HighlightPane } from "./HighlightPane";

export function HighlightDialog({
  canCompare,
  differences,
  onClose,
  sourceData,
  targetData,
}) {
  return (
    <div
      aria-labelledby="highlight-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-2 py-3 sm:px-4 sm:py-6"
      role="dialog"
    >
      <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg bg-zinc-50 shadow-2xl sm:max-h-[90vh]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div>
            <h2
              className="text-lg font-semibold text-zinc-950"
              id="highlight-dialog-title"
            >
              Highlighted JSON
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Hover or focus a highlighted row to inspect the difference.
            </p>
          </div>
          <IconButton label="Close highlighted JSON dialog" onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </IconButton>
        </div>

        <div className="overflow-auto p-2 sm:p-4">
          {canCompare ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <HighlightPane
                data={sourceData}
                differences={differences}
                title="Source JSON highlights"
              />
              <HighlightPane
                data={targetData}
                differences={differences}
                title="Target JSON highlights"
              />
            </div>
          ) : (
            <p className="text-sm text-zinc-600">
              Add valid JSON to both inputs to view highlights.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
