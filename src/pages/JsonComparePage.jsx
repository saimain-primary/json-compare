import { useDeferredValue, useMemo, useState } from "react";
import logo from "../assets/logo.png";
import { ProfileDialog } from "../components/profile/ProfileDialog";
import { ThemeToggle } from "../components/common/ThemeToggle";
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
import { supabase } from "../supabaseClient";
import { CompareSettings } from "../components/json/CompareSettings";
import { DifferencesDialog } from "../components/json/DifferencesDialog";
import { HighlightDialog } from "../components/json/HighlightDialog";
import { JsonEditorPanel } from "../components/json/JsonEditorPanel";

function getUserDisplayName(user) {
  return (
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email
  );
}

function getUserAvatarUrl(user) {
  return user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
}

function getUserInitials(name) {
  const words = name
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export function JsonComparePage({ onToggleTheme, session, theme }) {
  const [sourceJson, setSourceJson] = useState(starterSource);
  const [targetJson, setTargetJson] = useState(starterTarget);
  const [compareOptions, setCompareOptions] = useState(defaultCompareOptions);
  const [editorScroll, setEditorScroll] = useState({
    source: 0,
    target: 0,
  });
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [compareMenuOpen, setCompareMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [activeLinePopup, setActiveLinePopup] = useState(null);
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

  function formatInputs() {
    if (!sourceResult.error && !sourceResult.empty) {
      setSourceJson(JSON.stringify(sourceResult.data, null, 2));
    }
    if (!targetResult.error && !targetResult.empty) {
      setTargetJson(JSON.stringify(targetResult.data, null, 2));
    }
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  const accountLabel = getUserDisplayName(session.user);
  const accountAvatarUrl = getUserAvatarUrl(session.user);
  const accountInitials = getUserInitials(accountLabel);
  const panels = [
    {
      id: "source",
      label: "Source JSON",
      value: sourceJson,
      setValue: setSourceJson,
      lineDifferences: sourceLineDifferences,
      result: sourceResult,
      description: "Original or baseline payload",
    },
    {
      id: "target",
      label: "Target JSON",
      value: targetJson,
      setValue: setTargetJson,
      lineDifferences: targetLineDifferences,
      result: targetResult,
      description: "Payload to compare against the source",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-50 px-3 py-5 text-zinc-950 sm:px-4">
      <div className="flex w-full flex-col gap-5">
        <header className="flex flex-col gap-4 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <img
              alt="Blame the API logo"
              className="h-14 w-36 rounded-lg object-contain sm:h-18 sm:w-48"
              src={logo}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <button
              className="rounded-md border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200"
              onClick={() => {
                setSourceJson("");
                setTargetJson("");
              }}
              type="button"
            >
              Clear
            </button>
            <button
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400"
              onClick={formatInputs}
              type="button"
            >
              Format JSON
            </button>
            <div className="relative col-span-2 sm:col-span-1">
              <button
                aria-expanded={accountMenuOpen}
                className="flex w-full min-w-0 items-center justify-between gap-3 rounded-md border border-zinc-300 bg-white px-3 py-2 text-left shadow-sm transition hover:border-zinc-400 sm:w-72"
                onClick={() => setAccountMenuOpen((open) => !open)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-3">
                  {accountAvatarUrl ? (
                    <img
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-zinc-200"
                      src={accountAvatarUrl}
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white ring-1 ring-teal-800">
                      {accountInitials}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-zinc-950">
                      {accountLabel}
                    </span>
                    <span className="block truncate text-xs font-medium text-zinc-500">
                      {session.user.email}
                    </span>
                  </span>
                </span>
                <span aria-hidden="true" className="text-zinc-500">
                  ▾
                </span>
              </button>
              {accountMenuOpen ? (
                <div className="absolute right-0 top-11 z-40 w-full rounded-lg border border-zinc-200 bg-white p-2 shadow-xl sm:w-72">
                  <div className="border-b border-zinc-100 px-2 pb-2">
                    <p className="truncate text-sm font-semibold text-zinc-950">
                      {accountLabel}
                    </p>
                    {accountLabel !== session.user.email ? (
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        {session.user.email}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-2 space-y-1">
                    <button
                      className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
                      onClick={() => {
                        setProfileDialogOpen(true);
                        setAccountMenuOpen(false);
                      }}
                      type="button"
                    >
                      Profile
                    </button>
                    <div className="flex items-center justify-between rounded-md px-2 py-2">
                      <span className="text-sm font-medium text-zinc-800">
                        Theme
                      </span>
                      <ThemeToggle onToggle={onToggleTheme} theme={theme} />
                    </div>
                    <button
                      className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                      onClick={handleLogout}
                      type="button"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

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
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
              disabled={!canCompare}
              onClick={() => setHighlightDialogOpen(true)}
              type="button"
            >
              Highlighted JSON
            </button>
            <button
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
              disabled={!canCompare || differences.length === 0}
              onClick={() => setDiffDialogOpen(true)}
              type="button"
            >
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

        {profileDialogOpen ? (
          <ProfileDialog
            onClose={() => setProfileDialogOpen(false)}
            session={session}
          />
        ) : null}

        {diffDialogOpen ? (
          <DifferencesDialog
            differences={differences}
            hasSelectedCompareOption={hasSelectedCompareOption}
            onClose={() => setDiffDialogOpen(false)}
          />
        ) : null}
      </div>
    </main>
  );
}
