import { useState } from "react";
import { Check, GitCompareArrows, Plus, X } from "lucide-react";
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
}) {
  const [compareName, setCompareName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const compare = await onCreateCompare(compareName);

    if (compare) {
      setCompareName("");
      setCreateDialogOpen(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-zinc-950">
            {collection.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Create multiple compares inside this collection.
          </p>
        </div>

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 sm:w-auto"
          onClick={() => setCreateDialogOpen(true)}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Create compare
        </button>
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
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-6 text-sm font-medium text-zinc-600">
          Loading compares...
        </div>
      ) : compares.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
          <GitCompareArrows
            aria-hidden="true"
            className="mx-auto text-zinc-400"
            size={28}
          />
          <p className="mt-3 text-base font-semibold text-zinc-950">
            No compares yet
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Create a compare for an endpoint, bug, release, or payload pair.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {compares.map((compare) => (
            <button
              className="group rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-500 hover:shadow-md"
              key={compare.id}
              onClick={() => onOpenCompare(compare)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-zinc-950">
                    {compare.name}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Created {formatDate(compare.created_at)}
                  </p>
                </div>
                <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                  Open
                </span>
              </div>
              <div className="mt-5 rounded-md bg-zinc-50 px-3 py-2 text-xs">
                <p className="font-semibold text-zinc-950">Versions</p>
                <p className="mt-1 text-zinc-500">
                  Save source and target JSON snapshots here.
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {createDialogOpen ? (
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
