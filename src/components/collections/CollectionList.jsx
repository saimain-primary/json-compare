import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { IconButton } from "../common/IconButton";

function formatDate(value) {
  if (!value) return "New collection";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CollectionList({
  collections,
  creatingCollection,
  error,
  loading,
  onCreateCollection,
  onOpenCollection,
}) {
  const [collectionName, setCollectionName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const collection = await onCreateCollection(collectionName);

    if (collection) {
      setCollectionName("");
      setCreateDialogOpen(false);
    }
  }

  return (
    <section className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
          <p className="mt-1 text-xs">
            If this is the first run, apply the collections migration in
            Supabase.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-6 text-sm font-medium text-zinc-600">
          Loading collections...
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
          <p className="text-base font-semibold text-zinc-950">
            No collections yet
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Name your first collection to start comparing API responses.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {collections.map((collection) => (
            <button
              className="group rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-500 hover:shadow-md"
              key={collection.id}
              onClick={() => onOpenCollection(collection)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-zinc-950">
                    {collection.name}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Created {formatDate(collection.created_at)}
                  </p>
                </div>
                <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                  Open
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-zinc-50 px-3 py-2">
                  <p className="font-semibold text-zinc-950">0</p>
                  <p className="mt-1 text-zinc-500">Saved compares</p>
                </div>
                <div className="rounded-md bg-zinc-50 px-3 py-2">
                  <p className="font-semibold text-zinc-950">Ready</p>
                  <p className="mt-1 text-zinc-500">Workspace</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {createDialogOpen ? (
        <div
          aria-labelledby="create-collection-title"
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
                  id="create-collection-title"
                >
                  Create collection
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Name the workspace for this set of API responses.
                </p>
              </div>
              <IconButton
                label="Close create collection dialog"
                onClick={() => {
                  setCollectionName("");
                  setCreateDialogOpen(false);
                }}
              >
                <X aria-hidden="true" size={18} />
              </IconButton>
            </div>

            <div className="px-5 py-5">
              <label className="block text-sm font-semibold text-zinc-800">
                Collection name
                <input
                  autoFocus
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                  maxLength={120}
                  onChange={(event) => setCollectionName(event.target.value)}
                  placeholder="Production API"
                  type="text"
                  value={collectionName}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
              <button
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
                onClick={() => {
                  setCollectionName("");
                  setCreateDialogOpen(false);
                }}
                type="button"
              >
                <X aria-hidden="true" size={16} />
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                disabled={creatingCollection || !collectionName.trim()}
                type="submit"
              >
                <Check aria-hidden="true" size={16} />
                {creatingCollection ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
