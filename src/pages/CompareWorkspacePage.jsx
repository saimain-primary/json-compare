import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Eye, Info } from "lucide-react";
import { CompareSettings } from "../components/json/CompareSettings";
import { DifferencesDialog } from "../components/json/DifferencesDialog";
import { HighlightDialog } from "../components/json/HighlightDialog";
import { JsonEditorPanel } from "../components/json/JsonEditorPanel";
import { Breadcrumb } from "../components/layout/CollectionWorkspaceHeader";
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
import { selectedCompareSummary, statusClass, statusLabel } from "../lib/ui";

export function CompareWorkspacePage() {
  const navigate = useNavigate();
  const { collectionId, compareId } = useParams();
  const { session, setCompareActions } = useOutletContext();
  const [sourceJson, setSourceJson] = useState(starterSource);
  const [targetJson, setTargetJson] = useState(starterTarget);
  const [compareOptions, setCompareOptions] = useState(defaultCompareOptions);
  const [editorScroll, setEditorScroll] = useState({ source: 0, target: 0 });
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false);
  const [compareMenuOpen, setCompareMenuOpen] = useState(false);
  const [activeLinePopup, setActiveLinePopup] = useState(null);
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
    setCompareActions({
      onClearJson: clearInputs,
      onFormatJson: formatInputs,
    });

    return () => setCompareActions(null);
  }, [clearInputs, formatInputs, setCompareActions]);

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

  async function handleSaveVersion(name) {
    return createVersion({
      compareOptions,
      diffCount: differences.length,
      name,
      sourceJson,
      targetJson,
    });
  }

  async function handleLoadVersion(version) {
    const files = await loadVersionFiles(version);

    if (!files) return;

    setSourceJson(files.sourceJson);
    setTargetJson(files.targetJson);
  }

  if (collectionLoading || compareLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-6 text-sm font-medium text-zinc-600">
        Loading compare workspace...
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

  const panels = [
    {
      id: "source",
      label: "Backend JSON",
      value: sourceJson,
      setValue: setSourceJson,
      lineDifferences: sourceLineDifferences,
      result: sourceResult,
      description: "Response from the backend / API",
    },
    {
      id: "target",
      label: "Frontend JSON",
      value: targetJson,
      setValue: setTargetJson,
      lineDifferences: targetLineDifferences,
      result: targetResult,
      description: "Payload received or used by the frontend",
    },
  ];

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Collections", to: "/collections" },
          { label: collection.name, to: `/collections/${collection.id}` },
          { label: compare.name },
        ]}
      />

      <VersionPanel
        canSave={canCompare}
        compare={compare}
        error={versionsError}
        loading={versionsLoading}
        loadingVersionFiles={loadingVersionFiles}
        onLoadVersion={handleLoadVersion}
        onSaveVersion={handleSaveVersion}
        savingVersion={savingVersion}
        versions={versions}
      />

      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
        <p className="text-sm text-zinc-600">
          Compare mode:{" "}
          <span className="font-semibold text-zinc-950">
            {selectedCompareSummary(compareOptions)}
          </span>
          {canCompare ? (
            <span className="ml-2 text-zinc-400">
              {differences.length} difference
              {differences.length === 1 ? "" : "s"}
            </span>
          ) : liveCompareTooLarge ? (
            <span className="ml-2 text-amber-600">
              Live compare paused for large JSON
            </span>
          ) : null}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <CompareSettings
            compareAll={compareAll}
            compareMenuOpen={compareMenuOpen}
            compareOptions={compareOptions}
            onToggleAll={updateCompareAll}
            onToggleMenu={() => setCompareMenuOpen((open) => !open)}
            onToggleOption={updateCompareOption}
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
            disabled={!canCompare}
            onClick={() => setHighlightDialogOpen(true)}
            type="button"
          >
            <Eye aria-hidden="true" size={16} />
            Highlighted JSON
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            disabled={!canCompare || differences.length === 0}
            onClick={() => setDiffDialogOpen(true)}
            type="button"
          >
            <Info aria-hidden="true" size={16} />
            View details
          </button>
        </div>
      </section>

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
