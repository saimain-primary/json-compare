import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  FileJson,
  Link as LinkIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { AccountMenu } from "./AccountMenu";
import { supabase } from "../../supabaseClient";

const sidebarStorageKey = "blame-the-api:sidebar-width";
const minSidebarWidth = 220;
const maxSidebarWidth = 420;
const defaultSidebarWidth = 280;

function getInitialSidebarWidth() {
  try {
    const savedWidth = Number(window.localStorage.getItem(sidebarStorageKey));
    if (savedWidth >= minSidebarWidth && savedWidth <= maxSidebarWidth) {
      return savedWidth;
    }
  } catch {
    // Sidebar size is a convenience preference.
  }
  return defaultSidebarWidth;
}

function clampSidebarWidth(width) {
  return Math.min(Math.max(width, minSidebarWidth), maxSidebarWidth);
}

function CompareItem({ collectionId, compare, onDelete, onRename }) {
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameName, setRenameName] = useState(compare.name);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function handleMouseDown() {
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [menuOpen]);

  function openMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: Math.max(4, rect.right - 164) });
    }
    setMenuOpen(true);
  }

  async function handleRename(event) {
    event.preventDefault();
    const ok = await onRename(compare.id, renameName);
    if (ok) setRenameOpen(false);
  }

  async function handleDelete() {
    const ok = await onDelete(compare.id);
    if (ok) {
      setDeleteOpen(false);
      if (window.location.pathname.includes(compare.id)) {
        navigate(`/collections/${collectionId}`);
      }
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(
      `${window.location.origin}/collections/${collectionId}/compares/${compare.id}`,
    );
    setMenuOpen(false);
  }

  async function handleShare() {
    const url = `${window.location.origin}/collections/${collectionId}/compares/${compare.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: compare.name, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
    }
    setMenuOpen(false);
  }

  return (
    <div className="group flex items-center pr-0.5 pl-2">
      <NavLink
        className={({ isActive }) =>
          `min-w-0 flex-1 truncate rounded-md px-2 py-2 text-xs font-medium transition text-zinc-600`
        }
        title={compare.name}
        to={`/collections/${collectionId}/compares/${compare.id}`}
      >
        {compare.name}
      </NavLink>

      <button
        ref={buttonRef}
        aria-label="Compare options"
        className="shrink-0 rounded p-0.5 text-zinc-400 opacity-0 transition  cursor-pointer hover:text-zinc-700 group-hover:opacity-100"
        onClick={openMenu}
        type="button"
      >
        <MoreHorizontal aria-hidden="true" size={12} />
      </button>

      {menuOpen &&
        createPortal(
          <div
            className="fixed z-[200] min-w-[164px] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={() => {
                setMenuOpen(false);
                setRenameName(compare.name);
                setRenameOpen(true);
              }}
              type="button"
            >
              <Pencil aria-hidden="true" size={14} />
              Rename
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={handleCopyLink}
              type="button"
            >
              <LinkIcon aria-hidden="true" size={14} />
              Copy link
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={handleShare}
              type="button"
            >
              <Share2 aria-hidden="true" size={14} />
              Share
            </button>
            <div className="my-1 border-t border-zinc-100" />
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
              type="button"
            >
              <Trash2 aria-hidden="true" size={14} />
              Delete
            </button>
          </div>,
          document.body,
        )}

      {renameOpen ? (
        <div
          aria-labelledby="rename-compare-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4"
          role="dialog"
        >
          <form
            className="w-full max-w-md rounded-lg border border-zinc-200 bg-zinc-50 shadow-2xl"
            onSubmit={handleRename}
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
              <h2
                className="text-lg font-semibold text-zinc-950"
                id="rename-compare-title"
              >
                Rename compare
              </h2>
              <button
                aria-label="Close"
                className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100"
                onClick={() => setRenameOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="px-5 py-5">
              <label className="block text-sm font-semibold text-zinc-800">
                Compare name
                <input
                  autoFocus
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                  maxLength={160}
                  onChange={(e) => setRenameName(e.target.value)}
                  type="text"
                  value={renameName}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
              <button
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
                onClick={() => setRenameOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                disabled={
                  !renameName.trim() || renameName.trim() === compare.name
                }
                type="submit"
              >
                <Check aria-hidden="true" size={16} />
                Rename
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {deleteOpen ? (
        <div
          aria-labelledby="delete-compare-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-zinc-50 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
              <div>
                <h2
                  className="text-lg font-semibold text-zinc-950"
                  id="delete-compare-title"
                >
                  Delete compare
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  This will permanently delete &ldquo;{compare.name}&rdquo; and
                  all its saved versions.
                </p>
              </div>
              <button
                aria-label="Close"
                className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100"
                onClick={() => setDeleteOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <button
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
                onClick={() => setDeleteOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                onClick={handleDelete}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CollectionItem({ collection, onDelete, onRename, userId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const buttonRef = useRef(null);
  const [expanded, setExpanded] = useState(() =>
    window.location.pathname.startsWith(`/collections/${collection.id}`),
  );
  const [compares, setCompares] = useState(null);
  const [comparesLoading, setComparesLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameName, setRenameName] = useState(collection.name);

  // Auto-expand; reset compare list when arriving at collection root so new compares appear
  useEffect(() => {
    const root = `/collections/${collection.id}`;
    if (location.pathname === root) {
      setCompares(null);
      setExpanded(true);
    } else if (location.pathname.startsWith(root)) {
      setExpanded(true);
    }
  }, [location.pathname, collection.id]);

  // Fetch compares when first expanded
  useEffect(() => {
    if (!expanded || compares !== null) return undefined;

    let ignore = false;
    setComparesLoading(true);

    if (supabase && userId) {
      supabase
        .from("compares")
        .select("id,name,created_at")
        .eq("collection_id", collection.id)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (ignore) return;
          setComparesLoading(false);
          if (!error) setCompares(data ?? []);
        });
    } else {
      setComparesLoading(false);
      setCompares([]);
    }

    return () => {
      ignore = true;
    };
  }, [expanded, compares, collection.id, userId]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function handleMouseDown() {
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [menuOpen]);

  function openMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: Math.max(4, rect.right - 164) });
    }
    setMenuOpen(true);
  }

  async function handleRename(event) {
    event.preventDefault();
    const ok = await onRename(collection.id, renameName);
    if (ok) setRenameOpen(false);
  }

  async function handleDelete() {
    const ok = await onDelete(collection.id);
    if (ok) {
      setDeleteOpen(false);
      if (
        window.location.pathname.startsWith(`/collections/${collection.id}`)
      ) {
        navigate("/collections");
      }
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(
      `${window.location.origin}/collections/${collection.id}`,
    );
    setMenuOpen(false);
  }

  async function handleShare() {
    const url = `${window.location.origin}/collections/${collection.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: collection.name, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
    }
    setMenuOpen(false);
  }

  async function handleRenameCompare(compareId, newName) {
    const trimmedName = newName.trim();
    if (!trimmedName || !supabase || !userId) return false;
    const { error } = await supabase
      .from("compares")
      .update({ name: trimmedName })
      .eq("id", compareId)
      .eq("user_id", userId);
    if (error) return false;
    setCompares((current) =>
      current.map((c) =>
        c.id === compareId ? { ...c, name: trimmedName } : c,
      ),
    );
    return true;
  }

  async function handleDeleteCompare(compareId) {
    if (!supabase || !userId) return false;
    const { error } = await supabase
      .from("compares")
      .delete()
      .eq("id", compareId)
      .eq("user_id", userId);
    if (error) return false;
    setCompares((current) => current.filter((c) => c.id !== compareId));
    return true;
  }

  return (
    <div>
      {/* Collection row */}
      <div className="group flex items-center gap-0.5 pr-1 pl-2">
        <button
          aria-label={expanded ? "Collapse" : "Expand"}
          className="shrink-0 rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          onClick={() => setExpanded((e) => !e)}
          type="button"
        >
          {expanded ? (
            <ChevronDown aria-hidden="true" size={12} />
          ) : (
            <ChevronRight aria-hidden="true" size={12} />
          )}
        </button>

        <NavLink
          className={({ isActive }) =>
            `min-w-0 flex-1 truncate rounded-md py-1.5 text-sm font-medium transition `
          }
          title={collection.name}
          to={`/collections/${collection.id}`}
        >
          {collection.name}
        </NavLink>

        <button
          ref={buttonRef}
          aria-label="Collection options"
          className="shrink-0 rounded p-0.5 opacity-0 transition text-zinc-700 hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100"
          onClick={openMenu}
          type="button"
        >
          <MoreHorizontal aria-hidden="true" size={14} />
        </button>
      </div>

      {/* Compares list */}
      {expanded && (
        <div className="mb-1 ml-4  space-y-0.5 border-l border-zinc-100  pt-0.5">
          {comparesLoading ? (
            <p className="py-1 text-xs text-zinc-400">Loading…</p>
          ) : !compares || compares.length === 0 ? (
            <p className="py-1 text-xs text-zinc-400">No compares yet</p>
          ) : (
            compares.map((compare) => (
              <CompareItem
                collectionId={collection.id}
                compare={compare}
                key={compare.id}
                onDelete={handleDeleteCompare}
                onRename={handleRenameCompare}
              />
            ))
          )}
        </div>
      )}

      {menuOpen &&
        createPortal(
          <div
            className="fixed z-[200] min-w-[164px] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={() => {
                setMenuOpen(false);
                setRenameName(collection.name);
                setRenameOpen(true);
              }}
              type="button"
            >
              <Pencil aria-hidden="true" size={14} />
              Rename
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={() => {
                setMenuOpen(false);
                navigate(`/collections/${collection.id}`);
              }}
              type="button"
            >
              <Plus aria-hidden="true" size={14} />
              Add compare
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={handleCopyLink}
              type="button"
            >
              <LinkIcon aria-hidden="true" size={14} />
              Copy link
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={handleShare}
              type="button"
            >
              <Share2 aria-hidden="true" size={14} />
              Share
            </button>
            <div className="my-1 border-t border-zinc-100" />
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
              type="button"
            >
              <Trash2 aria-hidden="true" size={14} />
              Delete
            </button>
          </div>,
          document.body,
        )}

      {renameOpen ? (
        <div
          aria-labelledby="rename-collection-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4"
          role="dialog"
        >
          <form
            className="w-full max-w-md rounded-lg border border-zinc-200 bg-zinc-50 shadow-2xl"
            onSubmit={handleRename}
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
              <h2
                className="text-lg font-semibold text-zinc-950"
                id="rename-collection-title"
              >
                Rename collection
              </h2>
              <button
                aria-label="Close"
                className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100"
                onClick={() => setRenameOpen(false)}
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
                  onChange={(e) => setRenameName(e.target.value)}
                  type="text"
                  value={renameName}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
              <button
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
                onClick={() => setRenameOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                disabled={
                  !renameName.trim() || renameName.trim() === collection.name
                }
                type="submit"
              >
                <Check aria-hidden="true" size={16} />
                Rename
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {deleteOpen ? (
        <div
          aria-labelledby="delete-collection-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-zinc-50 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
              <div>
                <h2
                  className="text-lg font-semibold text-zinc-950"
                  id="delete-collection-title"
                >
                  Delete collection
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  This will permanently delete &ldquo;{collection.name}&rdquo;
                  and all its compares and versions.
                </p>
              </div>
              <button
                aria-label="Close"
                className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100"
                onClick={() => setDeleteOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <button
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
                onClick={() => setDeleteOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                onClick={handleDelete}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SidebarCollections({
  collections,
  collectionsLoading,
  createCollection,
  creatingCollection,
  deleteCollection,
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
            <p className="px-4 py-2 text-xs text-zinc-400">
              No collections yet
            </p>
          ) : (
            collections.map((collection) => (
              <CollectionItem
                collection={collection}
                key={collection.id}
                onDelete={deleteCollection}
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

export function AppLayout({
  accountMenuOpen,
  children,
  collections,
  collectionsLoading,
  createCollection,
  creatingCollection,
  deleteCollection,
  onClearJson,
  onFormatJson,
  onLogout,
  onOpenProfile,
  onToggleAccountMenu,
  onToggleTheme,
  outletContext,
  renameCollection,
  session,
  showCompareActions,
  theme,
}) {
  const [sidebarWidth, setSidebarWidth] = useState(getInitialSidebarWidth);
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    if (!resizing) return undefined;

    function handlePointerMove(event) {
      setSidebarWidth(clampSidebarWidth(event.clientX));
    }

    function handlePointerUp() {
      setResizing(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizing]);

  useEffect(() => {
    try {
      window.localStorage.setItem(sidebarStorageKey, String(sidebarWidth));
    } catch {
      // Sidebar size is a convenience preference.
    }
  }, [sidebarWidth]);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 lg:flex">
      <aside
        className="relative hidden min-h-screen shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col"
        style={{ width: sidebarWidth }}
      >
        <div className="px-4 py-4">
          <img
            alt="Blame the API logo"
            className="h-10 w-20 object-contain"
            src={logo}
          />
        </div>

        <nav className="flex-1 overflow-auto px-3 py-3">
          <SidebarCollections
            collections={collections}
            collectionsLoading={collectionsLoading}
            createCollection={createCollection}
            creatingCollection={creatingCollection}
            deleteCollection={deleteCollection}
            renameCollection={renameCollection}
            userId={session.user.id}
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

      <section className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex flex-col gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:hidden">
          <div className="flex items-center gap-3">
            <img
              alt="Blame the API logo"
              className="h-10 w-36 object-contain"
              src={logo}
            />
          </div>
        </header>

        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
            <Boxes aria-hidden="true" size={16} />
            Blame the API
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {showCompareActions ? (
              <>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200"
                  onClick={onClearJson}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={16} />
                  Clear
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400"
                  onClick={onFormatJson}
                  type="button"
                >
                  <FileJson aria-hidden="true" size={16} />
                  Format JSON
                </button>
              </>
            ) : null}
            <AccountMenu
              menuOpen={accountMenuOpen}
              onLogout={onLogout}
              onOpenProfile={onOpenProfile}
              onToggleMenu={onToggleAccountMenu}
              onToggleTheme={onToggleTheme}
              session={session}
              theme={theme}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet context={outletContext} />
          {children}
        </div>
      </section>
    </main>
  );
}
