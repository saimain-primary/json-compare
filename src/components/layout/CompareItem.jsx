import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Copy,
  Link as LinkIcon,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { publicCompareUrl } from "../../lib/publicShare";
import { useItemMenu } from "./useItemMenu";

export function CompareItem({
  collectionId,
  compare,
  onDelete,
  onDuplicate,
  onOpenCompareTab,
  onRename,
  userId,
}) {
  const navigate = useNavigate();
  const { buttonRef, open: menuOpen, pos: menuPos, setOpen: setMenuOpen, openAt: openMenu } =
    useItemMenu();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameName, setRenameName] = useState(compare.name);
  const [publicToken, setPublicToken] = useState(compare.public_token ?? "");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  const compareUrl = `${window.location.origin}/collections/${collectionId}/compares/${compare.id}`;
  const publicUrl = publicToken ? publicCompareUrl(publicToken) : "";

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

  async function handleDuplicate() {
    setDuplicateLoading(true);
    const duplicatedCompare = await onDuplicate?.(compare);
    setDuplicateLoading(false);
    setMenuOpen(false);

    if (!duplicatedCompare) return;

    onOpenCompareTab?.({
      collectionId,
      id: duplicatedCompare.id,
      name: duplicatedCompare.name,
    });
    navigate(`/collections/${collectionId}/compares/${duplicatedCompare.id}`);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(compareUrl);
    setMenuOpen(false);
  }

  async function handleShare() {
    setMenuOpen(false);

    if (publicUrl) {
      setShareUrl(publicUrl);
      setShareOpen(true);
      return;
    }

    if (!supabase) return;

    const token = crypto.randomUUID();
    setShareLoading(true);

    const { data, error } = await supabase
      .from("compares")
      .update({ is_public: true, public_token: token })
      .eq("id", compare.id)
      .eq("user_id", userId)
      .select("public_token")
      .single();

    setShareLoading(false);

    if (error) return;

    const nextToken = data.public_token;
    const nextUrl = publicCompareUrl(nextToken);
    setPublicToken(nextToken);
    setShareUrl(nextUrl);
    setShareOpen(true);
  }

  function handleCopyShareUrl() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleUnshare() {
    if (!supabase || !userId) return;
    const { error } = await supabase
      .from("compares")
      .update({ is_public: false, public_token: null })
      .eq("id", compare.id)
      .eq("user_id", userId);
    if (error) return;
    setPublicToken("");
    setShareUrl("");
    setShareOpen(false);
  }

  return (
    <div className="group flex items-center pr-0.5">
      <NavLink
        className={({ isActive }) =>
          `min-w-0 flex-1 truncate px-2 py-1 text-xs transition ${
            isActive
              ? "font-semibold text-zinc-900"
              : "font-medium text-zinc-500 hover:text-zinc-900"
          }`
        }
        title={compare.name}
        to={`/collections/${collectionId}/compares/${compare.id}`}
        onClick={() =>
          onOpenCompareTab?.({
            collectionId,
            id: compare.id,
            name: compare.name,
          })
        }
      >
        {compare.name}
      </NavLink>

      <button
        ref={buttonRef}
        aria-label="Compare options"
        className="shrink-0 rounded p-0.5 text-zinc-400 opacity-0 transition hover:bg-zinc-200 hover:text-zinc-700 group-hover:opacity-100"
        onClick={openMenu}
        type="button"
      >
        <MoreHorizontal aria-hidden="true" size={12} />
      </button>

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
              disabled={duplicateLoading}
              onClick={handleDuplicate}
              type="button"
            >
              <Copy aria-hidden="true" size={14} />
              {duplicateLoading ? "Duplicating..." : "Duplicate"}
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
                disabled={!renameName.trim() || renameName.trim() === compare.name}
                type="submit"
              >
                <Check aria-hidden="true" size={16} />
                Rename
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {shareOpen ? (
        <div
          aria-labelledby="share-compare-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-zinc-50 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
              <div>
                <h2
                  className="text-lg font-semibold text-zinc-950"
                  id="share-compare-title"
                >
                  Share publicly
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Anyone with this link can view this compare.
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
            <div className="flex justify-start border-t border-zinc-100 px-5 py-3">
              <button
                className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 transition hover:text-rose-800"
                onClick={handleUnshare}
                type="button"
              >
                <XCircle aria-hidden="true" size={13} />
                Stop sharing
              </button>
            </div>
          </div>
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
