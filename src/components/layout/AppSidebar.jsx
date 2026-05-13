import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { CollectionItem } from "./CollectionItem";

const storageKey = "blame-the-api:sidebar-width";
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;
const DEFAULT_WIDTH = 280;

function getInitialWidth() {
  try {
    const saved = Number(window.localStorage.getItem(storageKey));
    if (saved >= MIN_WIDTH && saved <= MAX_WIDTH) return saved;
  } catch {
    // Sidebar width is optional UI state.
  }
  return DEFAULT_WIDTH;
}

function clamp(width) {
  return Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH);
}

function CollectionsList({
  collections,
  collectionsLoading,
  createCollection,
  creatingCollection,
  deleteCollection,
  onOpenCompareTab,
  renameCollection,
  userId,
}) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");

  async function handleCreate(event) {
    event.preventDefault();
    const collection = await createCollection(name);
    if (collection) {
      setName("");
      setCreateOpen(false);
      navigate(`/collections/${collection.id}`);
    }
  }

  function closeCreate() {
    setName("");
    setCreateOpen(false);
  }

  return (
    <>
      <div className="flex items-center gap-1 pt-3">
        <button
          className="flex flex-1 items-center gap-1 rounded-md px-1 py-1 text-left text-xs font-bold uppercase tracking-wide text-zinc-400 transition hover:text-zinc-600"
          onClick={() => setCollapsed((c) => !c)}
          type="button"
        >
          {collapsed ? (
            <ChevronRight aria-hidden="true" size={12} />
          ) : (
            <ChevronDown aria-hidden="true" size={12} />
          )}
          Collections
        </button>
        <button
          aria-label="New collection"
          className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          onClick={() => setCreateOpen(true)}
          type="button"
        >
          <Plus aria-hidden="true" size={14} />
        </button>
      </div>

      {!collapsed && (
        <div className="mt-1 space-y-0.5 pb-2">
          {collectionsLoading ? (
            <p className="px-4 py-2 text-xs text-zinc-400">Loading…</p>
          ) : collections.length === 0 ? (
            <p className="px-4 py-2 text-xs text-zinc-400">No collections yet</p>
          ) : (
            collections.map((collection) => (
              <CollectionItem
                collection={collection}
                key={collection.id}
                onDelete={deleteCollection}
                onOpenCompareTab={onOpenCompareTab}
                onRename={renameCollection}
                userId={userId}
              />
            ))
          )}
        </div>
      )}

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4">
          <form
            className="w-full max-w-md rounded-lg border border-zinc-200 bg-zinc-50 shadow-2xl"
            onSubmit={handleCreate}
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950">
                  Create collection
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Name the workspace for this set of API responses.
                </p>
              </div>
              <button
                aria-label="Close"
                className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100"
                onClick={closeCreate}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="px-5 py-5">
              <label className="block text-sm font-semibold text-zinc-800">
                Collection name
                <input
                  autoFocus
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                  maxLength={120}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production API"
                  type="text"
                  value={name}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
              <button
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
                onClick={closeCreate}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                disabled={creatingCollection || !name.trim()}
                type="submit"
              >
                <Check aria-hidden="true" size={16} />
                {creatingCollection ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

export function AppSidebar({
  collections,
  collectionsLoading,
  createCollection,
  creatingCollection,
  deleteCollection,
  onOpenCompareTab,
  renameCollection,
  userId,
}) {
  const [width, setWidth] = useState(getInitialWidth);
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    if (!resizing) return undefined;

    function onPointerMove(event) {
      setWidth(clamp(event.clientX));
    }
    function onPointerUp() {
      setResizing(false);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizing]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, String(width));
    } catch {
      // Sidebar width is optional UI state.
    }
  }, [width]);

  return (
    <aside
      className="relative hidden min-h-screen shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col"
      style={{ width }}
    >
      <div className="py-2 flex items-center justify-center">
        <img alt="Who Changed the Response logo" className="h-14 w-auto object-contain" src={logo} />
      </div>

      <nav className="flex-1 overflow-auto px-3 py-1">
        <CollectionsList
          collections={collections}
          collectionsLoading={collectionsLoading}
          createCollection={createCollection}
          creatingCollection={creatingCollection}
          deleteCollection={deleteCollection}
          onOpenCompareTab={onOpenCompareTab}
          renameCollection={renameCollection}
          userId={userId}
        />
      </nav>

      <button
        aria-label="Resize sidebar"
        className={`absolute -right-1 top-0 h-full w-2 cursor-col-resize transition ${
          resizing ? "bg-violet-500/40" : "hover:bg-violet-500/30"
        }`}
        onPointerDown={(event) => {
          event.preventDefault();
          setResizing(true);
        }}
        type="button"
      />
    </aside>
  );
}
