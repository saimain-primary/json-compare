import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Link as LinkIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { publicCollectionUrl } from "../../lib/publicShare";
import { CompareItem } from "./CompareItem";
import { useItemMenu } from "./useItemMenu";

const bucketName = "json-version-files";

export function CollectionItem({
  collection,
  onDelete,
  onOpenCompareTab,
  onRename,
  userId,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { buttonRef, open: menuOpen, pos: menuPos, setOpen: setMenuOpen, openAt: openMenu } =
    useItemMenu();
  const [expanded, setExpanded] = useState(() =>
    window.location.pathname.startsWith(`/collections/${collection.id}`),
  );
  const [compares, setCompares] = useState(null);
  const [comparesLoading, setComparesLoading] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameName, setRenameName] = useState(collection.name);
  const [publicToken, setPublicToken] = useState(collection.public_token ?? "");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const collectionUrl = `${window.location.origin}/collections/${collection.id}`;
  const publicUrl = publicToken ? publicCollectionUrl(publicToken) : "";

  // Auto-expand; reset compare list at collection root so newly created compares appear
  useEffect(() => {
    let ignore = false;

    async function syncExpandedState() {
      await Promise.resolve();

      if (ignore) return;

      const root = `/collections/${collection.id}`;
      if (location.pathname === root) {
        setCompares(null);
        setExpanded(true);
      } else if (location.pathname.startsWith(root)) {
        setExpanded(true);
      }
    }

    syncExpandedState();

    return () => {
      ignore = true;
    };
  }, [location.pathname, collection.id]);

  // Lazy-load compares when first expanded
  useEffect(() => {
    if (!expanded || compares !== null) return undefined;

    let ignore = false;

    async function loadCompares() {
      await Promise.resolve();

      if (ignore) return;

      setComparesLoading(true);

      if (supabase && userId) {
        supabase
        .from("compares")
        .select("id,name,is_public,public_token,created_at")
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
    }

    loadCompares();

    return () => {
      ignore = true;
    };
  }, [expanded, compares, collection.id, userId]);

  async function handleRename(event) {
    event.preventDefault();
    const ok = await onRename(collection.id, renameName);
    if (ok) setRenameOpen(false);
  }

  async function handleDelete() {
    const ok = await onDelete(collection.id);
    if (ok) {
      setDeleteOpen(false);
      if (window.location.pathname.startsWith(`/collections/${collection.id}`)) {
        navigate("/collections");
      }
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(collectionUrl);
    setMenuOpen(false);
  }

  async function handleShare() {
    setMenuOpen(false);

    if (publicUrl) {
      setShareUrl(publicUrl);
      setShareOpen(true);
      return;
    }

    if (!supabase || !userId) return;

    const token = crypto.randomUUID();
    setShareLoading(true);

    const { data, error } = await supabase
      .from("collections")
      .update({ is_public: true, public_token: token })
      .eq("id", collection.id)
      .eq("user_id", userId)
      .select("public_token")
      .single();

    setShareLoading(false);

    if (error) return;

    const nextToken = data.public_token;
    const nextUrl = publicCollectionUrl(nextToken);
    setPublicToken(nextToken);
    setShareUrl(nextUrl);
    setShareOpen(true);
  }

  function handleCopyShareUrl() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      current.map((c) => (c.id === compareId ? { ...c, name: trimmedName } : c)),
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

  async function handleDuplicateCompare(compareToDuplicate) {
    if (!supabase || !userId) return null;

    const duplicateName = `${compareToDuplicate.name} copy`;
    const { data: duplicatedCompare, error: compareError } = await supabase
      .from("compares")
      .insert({
        collection_id: collection.id,
        name: duplicateName,
        user_id: userId,
      })
      .select("id,name,is_public,public_token,created_at")
      .single();

    if (compareError) return null;

    const { data: versions, error: versionsError } = await supabase
      .from("compare_versions")
      .select(
        "name,source_path,target_path,source_size,target_size,diff_count,compare_options",
      )
      .eq("compare_id", compareToDuplicate.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (versionsError) {
      await supabase
        .from("compares")
        .delete()
        .eq("id", duplicatedCompare.id)
        .eq("user_id", userId);
      return null;
    }

    const duplicatedVersions = [];

    for (const version of versions ?? []) {
      const versionId = crypto.randomUUID();
      const basePath = `${userId}/${collection.id}/${duplicatedCompare.id}/${versionId}`;
      const sourcePath = `${basePath}/source.json`;
      const targetPath = `${basePath}/target.json`;

      const sourceCopy = await supabase.storage
        .from(bucketName)
        .copy(version.source_path, sourcePath);
      const targetCopy = sourceCopy.error
        ? { error: sourceCopy.error }
        : await supabase.storage
            .from(bucketName)
            .copy(version.target_path, targetPath);

      if (sourceCopy.error || targetCopy.error) {
        await supabase
          .from("compares")
          .delete()
          .eq("id", duplicatedCompare.id)
          .eq("user_id", userId);
        return null;
      }

      duplicatedVersions.push({
        id: versionId,
        compare_id: duplicatedCompare.id,
        compare_options: version.compare_options,
        diff_count: version.diff_count,
        name: version.name,
        source_path: sourcePath,
        source_size: version.source_size,
        target_path: targetPath,
        target_size: version.target_size,
        user_id: userId,
      });
    }

    if (duplicatedVersions.length > 0) {
      const { error: insertVersionsError } = await supabase
        .from("compare_versions")
        .insert(duplicatedVersions);

      if (insertVersionsError) {
        await supabase
          .from("compares")
          .delete()
          .eq("id", duplicatedCompare.id)
          .eq("user_id", userId);
        return null;
      }
    }

    setCompares((current) => [duplicatedCompare, ...(current ?? [])]);
    return duplicatedCompare;
  }

  return (
    <div>
      {/* Collection row */}
      <div className="group flex items-center gap-0.5 pr-1">
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
            `min-w-0 flex-1 truncate px-1 py-1.5 text-sm transition ${
              isActive
                ? "font-semibold text-zinc-950"
                : "font-medium text-zinc-600 hover:text-zinc-950"
            }`
          }
          title={collection.name}
          to={`/collections/${collection.id}`}
        >
          {collection.name}
        </NavLink>

        <button
          ref={buttonRef}
          aria-label="Collection options"
          className="shrink-0 rounded p-0.5 text-zinc-400 opacity-0 transition hover:bg-zinc-200 hover:text-zinc-700 group-hover:opacity-100"
          onClick={openMenu}
          type="button"
        >
          <MoreHorizontal aria-hidden="true" size={14} />
        </button>
      </div>

      {/* Compares list */}
      {expanded && (
        <div className="mb-1 ml-4 space-y-0.5 border-l border-zinc-100 pt-0.5">
          {comparesLoading ? (
            <p className="py-1 pl-2 text-xs text-zinc-400">Loading…</p>
          ) : !compares || compares.length === 0 ? (
            <p className="py-1 pl-2 text-xs text-zinc-400">No compares yet</p>
          ) : (
            compares.map((compare) => (
              <CompareItem
                collectionId={collection.id}
                compare={compare}
                key={compare.id}
                onDelete={handleDeleteCompare}
                onDuplicate={handleDuplicateCompare}
                onOpenCompareTab={onOpenCompareTab}
                onRename={handleRenameCompare}
              />
            ))
          )}
        </div>
      )}

      {/* Context menu */}
      {menuOpen &&
        createPortal(
          <div
            className="fixed z-200 min-w-41 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
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
              disabled={shareLoading}
              type="button"
            >
              <Share2 aria-hidden="true" size={14} />
              {publicToken ? "Copy public link" : "Share publicly"}
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

      {/* Share dialog */}
      {shareOpen ? (
        <div
          aria-labelledby="share-collection-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-zinc-50 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
              <div>
                <h2
                  className="text-lg font-semibold text-zinc-950"
                  id="share-collection-title"
                >
                  Share publicly
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Anyone with this link can view this collection.
                </p>
              </div>
              <button
                aria-label="Close"
                className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100"
                onClick={() => { setShareOpen(false); setCopied(false); }}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 select-all">
                  {shareUrl}
                </span>
                <button
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
                  onClick={handleCopyShareUrl}
                  type="button"
                >
                  {copied ? (
                    <><Check aria-hidden="true" size={13} />Copied</>
                  ) : (
                    <><Copy aria-hidden="true" size={13} />Copy</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Rename dialog */}
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
                disabled={!renameName.trim() || renameName.trim() === collection.name}
                type="submit"
              >
                <Check aria-hidden="true" size={16} />
                Rename
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Delete confirmation */}
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
