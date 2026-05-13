import { useState } from "react";
import { Check, ChevronRight, GitCompareArrows, Plus, X } from "lucide-react";
import { IconButton } from "../common/IconButton";

function formatDate(value) {
  if (!value) return "New compare";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CompareList({
  collection,
  compares,
  creatingCompare,
  error,
  loading,
  onCreateCompare,
  onOpenCompare,
  readOnly = false,
}) {
  const [compareName, setCompareName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (readOnly) return;

    const compare = await onCreateCompare(compareName);

    if (compare) {
      setCompareName("");
      setCreateDialogOpen(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {compares.length} {compares.length === 1 ? "compare" : "compares"}
        </p>
        {!readOnly ? (
          <button
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800"
            onClick={() => setCreateDialogOpen(true)}
            type="button"
          >
            <Plus aria-hidden="true" size={15} />
            New compare
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
          <p className="mt-1 text-xs">
            Apply the compares and versions migration in Supabase if this is
            the first run.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm font-medium text-zinc-400">Loading compares…</p>
        </div>
      ) : compares.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <GitCompareArrows
            aria-hidden="true"
            className="text-zinc-300"
            size={36}
          />
          <p className="mt-4 text-base font-semibold text-zinc-950">
            No compares yet
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Create a compare for an endpoint, bug, release, or payload pair.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {compares.map((compare, index) => (
            <button
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 ${
                index < compares.length - 1 ? "border-b border-zinc-100" : ""
              }`}
              key={compare.id}
              onClick={() => onOpenCompare(compare)}
              type="button"
            >
              <GitCompareArrows
                aria-hidden="true"
                className="shrink-0 text-zinc-400"
                size={16}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-950">
                  {compare.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {formatDate(compare.created_at)}
                </p>
              </div>
              <ChevronRight
                aria-hidden="true"
                className="shrink-0 text-zinc-300"
                size={16}
              />
            </button>
          ))}
        </div>
      )}

      {createDialogOpen && !readOnly ? (
        <div
          aria-labelledby="create-compare-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4 py-6"
          role="dialog"
        >
          <form
            className="w-full max-w-md rounded-lg border border-zinc-200 bg-zinc-50 shadow-2xl"
            onSubmit={handleSubmit}
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
              <div>
                <h2
                  className="text-lg font-semibold text-zinc-950"
                  id="create-compare-title"
                >
                  Create compare
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Name this API response comparison.
                </p>
              </div>
              <IconButton
                label="Close create compare dialog"
                onClick={() => {
                  setCompareName("");
                  setCreateDialogOpen(false);
                }}
              >
                <X aria-hidden="true" size={18} />
              </IconButton>
            </div>

            <div className="px-5 py-5">
              <label className="block text-sm font-semibold text-zinc-800">
                Compare name
                <input
                  autoFocus
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                  maxLength={160}
                  onChange={(event) => setCompareName(event.target.value)}
                  placeholder="GET /users response"
                  type="text"
                  value={compareName}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
              <button
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
                onClick={() => {
                  setCompareName("");
                  setCreateDialogOpen(false);
                }}
                type="button"
              >
                <X aria-hidden="true" size={16} />
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                disabled={creatingCompare || !compareName.trim()}
                type="submit"
              >
                <Check aria-hidden="true" size={16} />
                {creatingCompare ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
