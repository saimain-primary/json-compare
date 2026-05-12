import { useState } from "react";
import { Check, Download, Save, X } from "lucide-react";
import { IconButton } from "../common/IconButton";

function formatDate(value) {
  if (!value) return "New version";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function VersionPanel({
  canSave,
  compare,
  error,
  loading,
  loadingVersionFiles,
  onLoadVersion,
  onSaveVersion,
  savingVersion,
  versions,
}) {
  const [versionName, setVersionName] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const version = await onSaveVersion(versionName);

    if (version) {
      setVersionName("");
      setSaveDialogOpen(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Compare
          </p>
          <h2 className="truncate text-lg font-semibold text-zinc-950">
            {compare.name}
          </h2>
        </div>
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 sm:w-auto"
          disabled={!canSave || savingVersion}
          onClick={() => setSaveDialogOpen(true)}
          type="button"
        >
          <Save aria-hidden="true" size={16} />
          Save version
        </button>
      </div>

      {error ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <div className="p-3">
        {loading ? (
          <p className="rounded-md bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
            Loading versions...
          </p>
        ) : versions.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
            No versions yet. Paste source and target JSON, then save a version.
          </p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {versions.map((version) => (
              <button
                className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-left transition hover:border-violet-500 hover:bg-white"
                disabled={loadingVersionFiles}
                key={version.id}
                onClick={() => onLoadVersion(version)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-950">
                      {version.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDate(version.created_at)}
                    </p>
                  </div>
                  <Download
                    aria-hidden="true"
                    className="shrink-0 text-zinc-500"
                    size={16}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600">
                  <span>Source {formatBytes(version.source_size)}</span>
                  <span>Target {formatBytes(version.target_size)}</span>
                </div>
                <p className="mt-2 text-xs font-medium text-zinc-500">
                  {version.diff_count} differences
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {saveDialogOpen ? (
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
                {savingVersion ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
