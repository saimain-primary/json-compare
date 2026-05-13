import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Eye, Info } from "lucide-react";
import { CompareSettings } from "../components/json/CompareSettings";
import { DifferencesDialog } from "../components/json/DifferencesDialog";
import { HighlightDialog } from "../components/json/HighlightDialog";
import { JsonEditorPanel } from "../components/json/JsonEditorPanel";
import { VersionPanel } from "../components/versions/VersionPanel";
import { useCollection } from "../hooks/useCollection";
import { useCompare } from "../hooks/useCompare";
import { useCompareVersions } from "../hooks/useCompareVersions";
import {
  defaultCompareOptions,
  maxLiveCompareChars,
  starterSource,
  starterTarget,
} from "../lib/constants";
import {
  compareJson,
  getLineDifferenceMap,
  getLineNumbers,
  parseJson,
} from "../lib/jsonCompare";
import { statusClass, statusLabel } from "../lib/ui";

export function CompareWorkspacePage() {
  const { collectionId, compareId } = useParams();
  const { openCompareTab, session, setCompareActions } = useOutletContext();
  const [sourceJson, setSourceJson] = useState(starterSource);
  const [targetJson, setTargetJson] = useState(starterTarget);
  const [compareOptions, setCompareOptions] = useState(defaultCompareOptions);
  const [editorScroll, setEditorScroll] = useState({ source: 0, target: 0 });
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false);
  const [compareMenuOpen, setCompareMenuOpen] = useState(false);
  const [activeLinePopup, setActiveLinePopup] = useState(null);
  const [activeVersion, setActiveVersion] = useState(null);
  const { collection, collectionError, collectionLoading } = useCollection(
    collectionId,
    session.user.id,
  );
  const { compare, compareError, compareLoading } = useCompare(
    compareId,
    session.user.id,
  );
  const {
    createVersion,
    loadingVersionFiles,
    loadVersionFiles,
    savingVersion,
    versions,
    versionsError,
    versionsLoading,
  } = useCompareVersions({
    collectionId,
    compareId,
    userId: session.user.id,
  });
  const deferredSourceJson = useDeferredValue(sourceJson);
  const deferredTargetJson = useDeferredValue(targetJson);
  const liveCompareTooLarge =
    deferredSourceJson.length + deferredTargetJson.length > maxLiveCompareChars;

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
  const compareAll = Object.values(compareOptions).every(Boolean);
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

  const clearInputs = useCallback(() => {
    setSourceJson("");
    setTargetJson("");
  }, []);

  const formatInputs = useCallback(() => {
    if (!sourceResult.error && !sourceResult.empty) {
      setSourceJson(JSON.stringify(sourceResult.data, null, 2));
    }
    if (!targetResult.error && !targetResult.empty) {
      setTargetJson(JSON.stringify(targetResult.data, null, 2));
    }
  }, [sourceResult, targetResult]);

  useEffect(() => {
    if (!compare) return;

    openCompareTab?.({
      collectionId: compare.collection_id,
      id: compare.id,
      name: compare.name,
    });
  }, [compare, openCompareTab]);

  function updateCompareOption(option, checked) {
    setCompareOptions((current) => ({
      ...current,
      [option]: checked,
    }));
  }

  function updateCompareAll(checked) {
    setCompareOptions({
      key: checked,
      valueType: checked,
      value: checked,
    });
  }

  const handleSaveVersion = useCallback(async (name) => {
    return createVersion({
      compareOptions,
      diffCount: differences.length,
      name,
      sourceJson,
      targetJson,
    });
  }, [compareOptions, createVersion, differences.length, sourceJson, targetJson]);

  const handleLoadVersion = useCallback(async (version) => {
    const files = await loadVersionFiles(version);

    if (!files) return;

    setSourceJson(files.sourceJson);
    setTargetJson(files.targetJson);
    setActiveVersion(version);
  }, [loadVersionFiles]);

  const autoLoaded = useRef(false);
  const handleLoadVersionRef = useRef(handleLoadVersion);
  handleLoadVersionRef.current = handleLoadVersion;

  useEffect(() => {
    if (autoLoaded.current || versionsLoading || versions.length === 0) return;
    autoLoaded.current = true;
    handleLoadVersionRef.current(versions[0]);
  }, [versionsLoading, versions]);

  function handleSourceChange(value) {
    setSourceJson(value);
    setActiveVersion(null);
  }

  function handleTargetChange(value) {
    setTargetJson(value);
    setActiveVersion(null);
  }

  const compareToolbar = useMemo(
    () => (
      <>
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
        <CompareSettings
          compact
          compareAll={compareAll}
          compareMenuOpen={compareMenuOpen}
          compareOptions={compareOptions}
          onToggleAll={updateCompareAll}
          onToggleMenu={() => setCompareMenuOpen((open) => !open)}
          onToggleOption={updateCompareOption}
        />
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
        <VersionPanel
          canSave={canCompare}
          compact
          error={versionsError}
          loading={versionsLoading}
          loadingVersionFiles={loadingVersionFiles}
          onLoadVersion={handleLoadVersion}
          onSaveVersion={handleSaveVersion}
          savingVersion={savingVersion}
          versions={versions}
        />
      </>
    ),
    [
      activeVersion,
      canCompare,
      compareAll,
      compareMenuOpen,
      compareOptions,
      differences.length,
      handleLoadVersion,
      handleSaveVersion,
      liveCompareTooLarge,
      loadingVersionFiles,
      savingVersion,
      versions,
      versionsError,
      versionsLoading,
    ],
  );

  useEffect(() => {
    setCompareActions({
      onClearJson: clearInputs,
      onFormatJson: formatInputs,
      toolbar: compareToolbar,
    });

    return () => setCompareActions(null);
  }, [clearInputs, compareToolbar, formatInputs, setCompareActions]);

  if (collectionLoading || compareLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm font-medium text-zinc-400">Loading compare workspace…</p>
      </div>
    );
  }

  if (collectionError || compareError || !collection || !compare) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {collectionError || compareError || "Compare workspace not found."}
      </div>
    );
  }

  const editorLoading = loadingVersionFiles;

  const panels = [
    {
      id: "source",
      label: "Backend JSON",
      value: sourceJson,
      setValue: handleSourceChange,
      lineDifferences: sourceLineDifferences,
      result: sourceResult,
      description: "Response from the backend / API",
      loading: editorLoading,
    },
    {
      id: "target",
      label: "Frontend JSON",
      value: targetJson,
      setValue: handleTargetChange,
      lineDifferences: targetLineDifferences,
      result: targetResult,
      description: "Payload received or used by the frontend",
      loading: editorLoading,
    },
  ];

  return (
    <>
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
            statusClass={statusClass}
            statusLabel={statusLabel}
          />
        ))}
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
    </>
  );
}
