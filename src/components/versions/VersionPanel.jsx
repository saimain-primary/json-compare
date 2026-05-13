import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, History, RotateCcw, Save, X } from "lucide-react";
import { IconButton } from "../common/IconButton";

function formatDate(value) {
  if (!value) return "New version";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function VersionPanel({
  canSave,
  compact = false,
  error,
  loading,
  loadingVersionFiles,
  onLoadVersion,
  onSaveVersion,
  readOnly = false,
  savingVersion,
  versions,
}) {
  const dropdownRef = useRef(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [versionName, setVersionName] = useState("");

  useEffect(() => {
    if (!versionsOpen) return undefined;
    function onMouseDown(event) {
      if (!dropdownRef.current?.contains(event.target)) {
        setVersionsOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [versionsOpen]);

  async function handleSubmit(event) {
    event.preventDefault();
    const version = await onSaveVersion(versionName);
    if (version) {
      setVersionName("");
      setSaveDialogOpen(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {/* Versions dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          className={`inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-400 ${
            compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
          }`}
          onClick={() => setVersionsOpen((o) => !o)}
          type="button"
        >
          <History aria-hidden="true" size={compact ? 14 : 15} />
          Versions
          {versions.length > 0 && (
            <span className="text-xs font-normal text-zinc-400">
              {versions.length}
            </span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={`transition-transform ${versionsOpen ? "rotate-180" : ""}`}
            size={compact ? 12 : 13}
          />
        </button>

        {versionsOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
            {error ? (
              <p className="px-4 py-3 text-sm text-amber-700">{error}</p>
            ) : loading ? (
              <p className="px-4 py-3 text-sm text-zinc-500">Loading…</p>
            ) : versions.length === 0 ? (
              <p className="px-4 py-4 text-sm text-zinc-500">
                No versions saved yet.
              </p>
            ) : (
              <div className="max-h-72 overflow-auto">
                {versions.map((version) => (
                  <button
                    className="flex w-full items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3 text-left transition last:border-0 hover:bg-zinc-50 disabled:opacity-50"
                    disabled={loadingVersionFiles}
                    key={version.id}
                    onClick={() => {
                      onLoadVersion(version);
                      setVersionsOpen(false);
                    }}
                    type="button"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-950">
                        {version.name}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {formatDate(version.created_at)} · {version.diff_count}{" "}
                        diff{version.diff_count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <RotateCcw
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-zinc-400"
                      size={14}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!readOnly ? (
        <button
          className={`inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:text-zinc-400 ${
            compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
          }`}
          disabled={!canSave || savingVersion}
          onClick={() => setSaveDialogOpen(true)}
          type="button"
        >
          <Save aria-hidden="true" size={compact ? 14 : 15} />
          {savingVersion ? "Saving…" : compact ? "Save" : "Save version"}
        </button>
      ) : null}

      {/* Save dialog */}
      {saveDialogOpen && !readOnly ? (
        <div
          aria-labelledby="save-version-title"
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
                  id="save-version-title"
                >
                  Save version
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Saves source.json and target.json for this compare.
                </p>
              </div>
              <IconButton
                label="Close save version dialog"
                onClick={() => {
                  setVersionName("");
                  setSaveDialogOpen(false);
                }}
              >
                <X aria-hidden="true" size={18} />
              </IconButton>
            </div>

            <div className="px-5 py-5">
              <label className="block text-sm font-semibold text-zinc-800">
                Version name
                <input
                  autoFocus
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                  maxLength={160}
                  onChange={(event) => setVersionName(event.target.value)}
                  placeholder="v1.0.0 response"
                  type="text"
                  value={versionName}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
              <button
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
                onClick={() => {
                  setVersionName("");
                  setSaveDialogOpen(false);
                }}
                type="button"
              >
                <X aria-hidden="true" size={16} />
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                disabled={savingVersion || !versionName.trim()}
                type="submit"
              >
                <Check aria-hidden="true" size={16} />
                {savingVersion ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
