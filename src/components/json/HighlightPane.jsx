import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  containerLabel,
  formatValue,
  getChildPath,
  isContainerValue,
  keyFromPath,
  valueType,
} from "../../lib/jsonCompare";
import { maxTreeDepth, maxVisibleTreeChildren } from "../../lib/constants";
import { diffTone } from "../../lib/ui";

function DiffPopover({ difference }) {
  return (
    <div className="pointer-events-none absolute left-4 top-10 z-20 hidden w-[min(26rem,calc(100vw-3rem))] rounded-lg border border-zinc-200 bg-zinc-950 p-3 text-zinc-50 shadow-2xl group-hover:block group-focus-within:block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-mono text-xs text-zinc-300">{difference.path}</p>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-semibold uppercase text-zinc-200">
          {difference.type}
        </span>
      </div>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <p className="mb-1 font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Source
          </p>
          <code className="block break-all rounded bg-zinc-900 p-2 font-mono text-zinc-100">
            {difference.source}
          </code>
        </div>
        <div>
          <p className="mb-1 font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Target
          </p>
          <code className="block break-all rounded bg-zinc-900 p-2 font-mono text-zinc-100">
            {difference.target}
          </code>
        </div>
      </div>
    </div>
  );
}

function JsonTreeNode({
  depth,
  descendantCounts,
  differences,
  expandedPaths,
  onToggle,
  path,
  value,
}) {
  const type = valueType(value);
  const isContainer = isContainerValue(value);
  const directDifference = differences.find((difference) => {
    return difference.path === path;
  });
  const descendantDifferenceCount = descendantCounts.get(path) ?? 0;
  const highlighted = Boolean(directDifference);
  const hasDescendantDifference = descendantDifferenceCount > 0;
  const isExpanded = path === "$" || expandedPaths.has(path);
  const entries = isContainer ? Object.entries(value ?? {}) : [];
  const visibleEntries =
    isExpanded && depth < maxTreeDepth
      ? entries.slice(0, maxVisibleTreeChildren)
      : [];
  const hiddenEntryCount = Math.max(entries.length - visibleEntries.length, 0);
  const isDepthLimited = isExpanded && depth >= maxTreeDepth && entries.length > 0;

  return (
    <li>
      <div
        className={`group relative rounded-md border px-3 py-2 ${
          highlighted
            ? diffTone(directDifference.type)
            : hasDescendantDifference
              ? "border-rose-300 bg-rose-50/90"
              : "border-transparent bg-transparent"
        }`}
        tabIndex={highlighted ? 0 : -1}
      >
        <div
          className="grid min-w-[28rem] grid-cols-[minmax(10rem,1fr)_minmax(10rem,1.4fr)] items-center gap-4"
          style={{ paddingLeft: `${Math.min(depth, 8) * 14}px` }}
        >
          <span
            className={`flex items-center gap-2 break-all ${
              highlighted || hasDescendantDifference
                ? "text-zinc-950"
                : "text-zinc-400"
            }`}
          >
            {isContainer ? (
              <button
                aria-label={`${isExpanded ? "Collapse" : "Expand"} ${path}`}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-300 bg-white text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100"
                onClick={() => onToggle(path)}
                type="button"
              >
                {isExpanded ? (
                  <ChevronDown aria-hidden="true" size={14} />
                ) : (
                  <ChevronRight aria-hidden="true" size={14} />
                )}
              </button>
            ) : (
              <span className="h-5 w-5 shrink-0" />
            )}
            {keyFromPath(path)}
          </span>
          <span
            className={`break-all ${
              highlighted || hasDescendantDifference
                ? "font-semibold text-zinc-950"
                : "text-zinc-500"
            }`}
          >
            {isContainer ? containerLabel(value) : formatValue(value)}
            {hasDescendantDifference && !highlighted ? (
              <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-xs font-semibold text-rose-800">
                {descendantDifferenceCount}
              </span>
            ) : null}
          </span>
        </div>
        {highlighted ? <DiffPopover difference={directDifference} /> : null}
      </div>

      {isContainer && visibleEntries.length > 0 ? (
        <ol className="mt-1 space-y-1">
          {visibleEntries.map(([key, childValue]) => (
            <JsonTreeNode
              depth={depth + 1}
              descendantCounts={descendantCounts}
              differences={differences}
              expandedPaths={expandedPaths}
              key={getChildPath(path, key, type === "array")}
              onToggle={onToggle}
              path={getChildPath(path, key, type === "array")}
              value={childValue}
            />
          ))}
          {hiddenEntryCount > 0 ? (
            <li
              className="rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 font-mono text-sm text-zinc-600"
              style={{ marginLeft: `${Math.min(depth + 1, 8) * 14}px` }}
            >
              Showing first {maxVisibleTreeChildren} of {entries.length} items.
              Collapse this node or inspect a narrower JSON path for more.
            </li>
          ) : null}
        </ol>
      ) : null}

      {isDepthLimited ? (
        <ol className="mt-1 space-y-1">
          <li
            className="rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 font-mono text-sm text-zinc-600"
            style={{ marginLeft: `${Math.min(depth + 1, 8) * 14}px` }}
          >
            Nested preview paused at depth {maxTreeDepth}.
          </li>
        </ol>
      ) : null}
    </li>
  );
}

export function HighlightPane({ data, differences, title }) {
  const [expandedPaths, setExpandedPaths] = useState(() => new Set(["$"]));

  const descendantCounts = useMemo(() => {
    const counts = new Map();
    counts.set("$", differences.length);
    for (const diff of differences) {
      const parts = diff.path.split(/(?=\.|\[)/);
      let prefix = "";
      for (const part of parts) {
        prefix += part;
        counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
      }
    }
    return counts;
  }, [differences]);

  function togglePath(path) {
    setExpandedPaths((currentPaths) => {
      const nextPaths = new Set(currentPaths);

      if (nextPaths.has(path)) {
        nextPaths.delete(path);
      } else {
        nextPaths.add(path);
      }

      return nextPaths;
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
        <span className="text-xs font-medium text-zinc-500">
          Highlighted JSON
        </span>
      </div>
      <div className="max-h-[520px] overflow-auto bg-white p-3">
        <ol className="space-y-1 font-mono text-sm">
          <JsonTreeNode
            depth={0}
            descendantCounts={descendantCounts}
            differences={differences}
            expandedPaths={expandedPaths}
            onToggle={togglePath}
            path="$"
            value={data}
          />
        </ol>
      </div>
    </div>
  );
}
