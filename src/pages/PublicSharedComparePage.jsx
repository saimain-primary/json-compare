import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Eye, GitCompareArrows, Info } from "lucide-react";
import logo from "../assets/logo.png";
import { DifferencesDialog } from "../components/json/DifferencesDialog";
import { HighlightDialog } from "../components/json/HighlightDialog";
import { JsonEditorPanel } from "../components/json/JsonEditorPanel";
import { usePublicSharedCompare } from "../hooks/usePublicSharedCompare";
import {
  defaultCompareOptions,
  maxLiveCompareChars,
} from "../lib/constants";
import {
  compareJson,
  getLineDifferenceMap,
  getLineNumbers,
  parseJson,
} from "../lib/jsonCompare";
import { statusClass, statusLabel } from "../lib/ui";

export function PublicSharedComparePage() {
  const { compareId, collectionToken, token } = useParams();
  const {
    collection,
    compare,
    error,
    loading,
    loadingVersionFiles,
    loadVersionFiles,
    versions,
  } = usePublicSharedCompare(
    collectionToken && compareId
      ? { collectionToken, compareId }
      : { compareToken: token },
  );
  const [sourceJson, setSourceJson] = useState("");
  const [targetJson, setTargetJson] = useState("");
  const [activeVersion, setActiveVersion] = useState(null);
  const [editorScroll, setEditorScroll] = useState({ source: 0, target: 0 });
  const [activeLinePopup, setActiveLinePopup] = useState(null);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false);
  const deferredSourceJson = useDeferredValue(sourceJson);
  const deferredTargetJson = useDeferredValue(targetJson);
  const liveCompareTooLarge =
    deferredSourceJson.length + deferredTargetJson.length > maxLiveCompareChars;
  const compareOptions =
    activeVersion?.compare_options &&
    Object.keys(activeVersion.compare_options).length > 0
      ? activeVersion.compare_options
      : defaultCompareOptions;

  const sourceResult = useMemo(
    () => parseJson(deferredSourceJson),
    [deferredSourceJson],
  );
  const targetResult = useMemo(
    () => parseJson(deferredTargetJson),
    [deferredTargetJson],
  );
  const canCompare =
    !liveCompareTooLarge &&
    !sourceResult.empty &&
    !targetResult.empty &&
    !sourceResult.error &&
    !targetResult.error;
  const hasSelectedCompareOption = Object.values(compareOptions).some(Boolean);
  const differences = useMemo(() => {
    if (!canCompare) return [];
    try {
      return compareJson(sourceResult.data, targetResult.data, compareOptions);
    } catch {
      return [];
    }
  }, [canCompare, compareOptions, sourceResult.data, targetResult.data]);
  const sourceLineDifferences = useMemo(
    () => getLineDifferenceMap(deferredSourceJson, differences),
    [deferredSourceJson, differences],
  );
  const targetLineDifferences = useMemo(
    () => getLineDifferenceMap(deferredTargetJson, differences),
    [deferredTargetJson, differences],
  );

  async function handleLoadVersion(version) {
    const files = await loadVersionFiles(version);
    if (!files) return;
    setSourceJson(files.sourceJson);
    setTargetJson(files.targetJson);
    setActiveVersion(version);
  }

  useEffect(() => {
    let ignore = false;

    async function loadInitialVersion() {
      await Promise.resolve();
      if (!ignore && !activeVersion && versions.length > 0) {
        handleLoadVersion(versions[0]);
      }
    }

    loadInitialVersion();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versions, activeVersion]);

  const panels = [
    {
      id: "source",
      label: "Backend JSON",
      value: sourceJson,
      setValue: () => {},
      lineDifferences: sourceLineDifferences,
      result: sourceResult,
      description: "Shared source file",
      loading: loadingVersionFiles,
    },
    {
      id: "target",
      label: "Frontend JSON",
      value: targetJson,
      setValue: () => {},
      lineDifferences: targetLineDifferences,
      result: targetResult,
      description: "Shared target file",
      loading: loadingVersionFiles,
    },
  ];

  const backTo = collectionToken
    ? `/shared/collections/${collectionToken}`
    : "/";
  const backLabel = collectionToken ? "Back to collection" : "Open app";

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 lg:flex">
      {/* Sidebar */}
      <aside className="flex shrink-0 flex-col border-b border-zinc-200 bg-white lg:h-screen lg:w-72 lg:sticky lg:top-0 lg:border-b-0 lg:border-r">
        <div className="border-b border-zinc-200 px-4 py-3">
          <img
            alt="Who Changed the Response logo"
            className="h-10 w-36 object-contain"
            src={logo}
          />
        </div>

        {loading ? (
          <p className="px-4 py-3 text-sm text-zinc-400">Loading…</p>
        ) : error || !compare ? null : (
          <>
            <div className="border-b border-zinc-200 px-4 py-4">
              {collection && collectionToken ? (
                <Link
                  className="text-xs font-bold uppercase tracking-wide text-violet-700 transition hover:text-violet-900"
                  to={backTo}
                >
                  {collection.name}
                </Link>
              ) : (
                <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                  Compare
                </p>
              )}
              <h1 className="mt-1 truncate text-sm font-semibold text-zinc-950">
                {compare.name}
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500">Read only</p>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Versions
              </p>
              {versions.length === 0 ? (
                <p className="px-4 py-2 text-xs text-zinc-400">
                  No versions saved
                </p>
              ) : (
                versions.map((version) => {
                  const active = version.id === activeVersion?.id;
                  return (
                    <button
                      className={`flex w-full items-center gap-2 rounded-md px-4 py-1.5 text-left text-xs font-medium transition ${
                        active
                          ? "bg-violet-50 text-violet-700"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                      key={version.id}
                      onClick={() => handleLoadVersion(version)}
                      type="button"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {version.name}
                      </span>
                      {version.diff_count > 0 ? (
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                            active
                              ? "bg-violet-100 text-violet-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {version.diff_count}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </nav>
          </>
        )}
      </aside>

      {/* Main */}
      <section className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
            <GitCompareArrows aria-hidden="true" size={16} />
            <span className="max-w-64 truncate">
              {loading ? "Loading…" : compare?.name ?? "Compare"}
            </span>
          </div>
          <Link
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800"
            to={backTo}
          >
            {backLabel}
          </Link>
        </div>

        {/* Toolbar */}
        {!loading && !error && compare ? (
          <div className="flex min-h-9 items-center justify-end gap-2 border-b border-zinc-200 bg-zinc-100 px-3 py-1.5 mb-2">
            <span className="hidden rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-600 sm:inline-flex">
              {canCompare
                ? `${differences.length} diff${differences.length === 1 ? "" : "s"}`
                : liveCompareTooLarge
                  ? "Paused"
                  : "Not ready"}
            </span>
            {activeVersion ? (
              <span className="hidden max-w-36 truncate rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200 md:inline-flex">
                {activeVersion.name}
              </span>
            ) : null}
            <button
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:text-zinc-400"
              disabled={!canCompare}
              onClick={() => setHighlightDialogOpen(true)}
              type="button"
            >
              <Eye aria-hidden="true" size={14} />
              Highlighted
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-2 py-1 text-xs font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
              disabled={!canCompare || differences.length === 0}
              onClick={() => setDiffDialogOpen(true)}
              type="button"
            >
              <Info aria-hidden="true" size={14} />
              View diffs
            </button>
          </div>
        ) : null}

        {/* Content */}
        <div className="min-w-0 flex-1 overflow-auto px-4 py-1">
          {loading ? (
            <div className="flex flex-1 items-center justify-center py-24">
              <p className="text-sm font-medium text-zinc-400">
                Loading shared compare…
              </p>
            </div>
          ) : error || !compare ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error || "Shared compare not found."}
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
              <GitCompareArrows
                aria-hidden="true"
                className="text-zinc-300"
                size={40}
              />
              <p className="mt-4 text-base font-semibold text-zinc-950">
                No versions saved yet
              </p>
            </div>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {panels.map((panel) => (
                <JsonEditorPanel
                  activeLinePopup={activeLinePopup}
                  editorScroll={editorScroll}
                  getLineNumbers={getLineNumbers}
                  key={panel.label}
                  onActiveLinePopupChange={setActiveLinePopup}
                  onEditorScrollChange={setEditorScroll}
                  panel={panel}
                  readOnly
                  statusClass={statusClass}
                  statusLabel={statusLabel}
                />
              ))}
            </section>
          )}
        </div>
      </section>

      {highlightDialogOpen ? (
        <HighlightDialog
          canCompare={canCompare}
          differences={differences}
          onClose={() => setHighlightDialogOpen(false)}
          sourceData={sourceResult.data}
          targetData={targetResult.data}
        />
      ) : null}

      {diffDialogOpen ? (
        <DifferencesDialog
          differences={differences}
          hasSelectedCompareOption={hasSelectedCompareOption}
          onClose={() => setDiffDialogOpen(false)}
        />
      ) : null}
    </main>
  );
}
