import { Component, useDeferredValue, useEffect, useMemo, useState } from "react";
import logo from "./assets/logo.png";
import { hasSupabaseConfig, supabase } from "./supabaseClient";

const starterSource = `{
  "name": "json-compare",
  "version": "1.0.0",
  "features": ["paste", "format", "compare"],
  "enabled": true
}`;

const starterTarget = `{
  "name": "json-compare",
  "version": "1.1.0",
  "features": ["paste", "format", "compare", "export"],
  "enabled": true
}`;

const defaultCompareOptions = {
  key: true,
  valueType: true,
  value: true,
};

const themeStorageKey = "json-compare:theme";

const maxDifferences = 500;
const maxRenderedLineNumbers = 3000;
const maxPreviewLength = 500;
const maxLiveCompareChars = 800000;
const maxLineHighlightChars = 250000;
const maxTreeDepth = 12;
const maxVisibleTreeChildren = 200;

function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem(themeStorageKey);

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
  } catch {
    // Theme preference is optional.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getLineNumbers(value) {
  let lineCount = 1;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "\n") {
      lineCount += 1;
    }

    if (lineCount >= maxRenderedLineNumbers) break;
  }

  return Array.from(
    { length: lineCount },
    (_, index) => index + 1,
  );
}

function tokenizePath(path) {
  return [...path.matchAll(/\.([^.[\]]+)|\[(\d+)\]/g)].map(
    (match) => match[1] ?? Number(match[2]),
  );
}

function escapeJsonKey(key) {
  return key.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function findLineForPath(json, path) {
  if (path === "$") return 1;

  const lines = json.split("\n");
  const segments = tokenizePath(path);
  const nearestKey = [...segments].reverse().find((segment) => {
    return typeof segment === "string";
  });

  if (nearestKey) {
    const keyNeedle = `"${escapeJsonKey(nearestKey)}"`;
    const keyLineIndex = lines.findIndex((line) => line.includes(keyNeedle));

    if (keyLineIndex !== -1) {
      return keyLineIndex + 1;
    }
  }

  const lastSegment = segments.at(-1);
  const parentKey = [...segments]
    .slice(0, -1)
    .reverse()
    .find((segment) => typeof segment === "string");

  if (typeof lastSegment === "number" && parentKey) {
    const parentNeedle = `"${escapeJsonKey(parentKey)}"`;
    const parentLineIndex = lines.findIndex((line) =>
      line.includes(parentNeedle),
    );

    if (parentLineIndex === -1) return null;
    if (lines[parentLineIndex].includes("]")) return parentLineIndex + 1;

    let itemIndex = -1;

    for (let index = parentLineIndex + 1; index < lines.length; index += 1) {
      const trimmedLine = lines[index].trim();

      if (trimmedLine.startsWith("]")) return parentLineIndex + 1;
      if (!trimmedLine || trimmedLine === "[") continue;

      itemIndex += 1;

      if (itemIndex === lastSegment) {
        return index + 1;
      }
    }
  }

  return null;
}

function getLineDifferenceMap(json, differences) {
  const lineMap = new Map();

  if (json.length > maxLineHighlightChars) {
    return lineMap;
  }

  differences.forEach((difference) => {
    const line = findLineForPath(json, difference.path);

    if (!line) return;

    lineMap.set(line, [...(lineMap.get(line) ?? []), difference]);
  });

  return lineMap;
}

function parseJson(value) {
  if (!value.trim()) {
    return { data: null, error: null, empty: true };
  }

  try {
    return { data: JSON.parse(value), error: null, empty: false };
  } catch (error) {
    return { data: null, error: error.message, empty: false };
  }
}

function formatValue(value) {
  if (value === undefined) return "missing";

  const type = valueType(value);

  if (type === "array") {
    return `[array:${value.length}]`;
  }

  if (type === "object") {
    return `{object:${Object.keys(value ?? {}).length}}`;
  }

  const formattedValue =
    typeof value === "string" ? `"${value}"` : JSON.stringify(value);

  if (formattedValue.length <= maxPreviewLength) {
    return formattedValue;
  }

  return `${formattedValue.slice(0, maxPreviewLength)}...`;
}

function valueType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function compareJson(source, target, options, path = "$", differences = []) {
  if (
    differences.length >= maxDifferences ||
    path.length > 2000 ||
    Object.is(source, target)
  ) {
    return differences;
  }

  const sourceType = valueType(source);
  const targetType = valueType(target);

  if (sourceType !== targetType) {
    if (options.valueType) {
      differences.push({
        type: "type",
        path,
        source: `${sourceType}: ${formatValue(source)}`,
        target: `${targetType}: ${formatValue(target)}`,
      });
    }

    return differences;
  }

  if (sourceType !== "object" && sourceType !== "array") {
    if (options.value) {
      differences.push({
        type: "value",
        path,
        source: formatValue(source),
        target: formatValue(target),
      });
    }

    return differences;
  }

  const keys = new Set([
    ...Object.keys(source ?? {}),
    ...Object.keys(target ?? {}),
  ]);

  for (const key of keys) {
    if (differences.length >= maxDifferences) break;

    const nextPath = Array.isArray(source)
      ? `${path}[${key}]`
      : `${path}.${key}`;
    const sourceHasKey = Object.prototype.hasOwnProperty.call(source, key);
    const targetHasKey = Object.prototype.hasOwnProperty.call(target, key);

    if (!sourceHasKey) {
      if (options.key) {
        differences.push({
          type: "added",
          path: nextPath,
          source: "missing",
          target: formatValue(target[key]),
        });
      }

      continue;
    }

    if (!targetHasKey) {
      if (options.key) {
        differences.push({
          type: "removed",
          path: nextPath,
          source: formatValue(source[key]),
          target: "missing",
        });
      }

      continue;
    }

    compareJson(source[key], target[key], options, nextPath, differences);
  }

  return differences;
}

function statusLabel(result) {
  if (result.empty) return "Waiting";
  if (result.error) return "Invalid JSON";
  return "Valid JSON";
}

function statusClass(result) {
  if (result.empty) return "bg-slate-100 text-slate-600 ring-slate-200";
  if (result.error) return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

function keyFromPath(path) {
  if (path === "$") return "$";
  const bracketMatch = path.match(/\[(\d+)\]$/);
  if (bracketMatch) return `[${bracketMatch[1]}]`;
  return path.split(".").at(-1);
}

function diffTone(type) {
  if (type === "added") return "border-emerald-300 bg-emerald-50";
  if (type === "removed") return "border-amber-300 bg-amber-50";
  if (type === "type") return "border-fuchsia-300 bg-fuchsia-50";
  return "border-sky-300 bg-sky-50";
}

function diffBadgeClass(type) {
  if (type === "added") return "bg-emerald-50 text-emerald-700";
  if (type === "removed") return "bg-amber-50 text-amber-700";
  if (type === "type") return "bg-fuchsia-50 text-fuchsia-700";
  return "bg-sky-50 text-sky-700";
}

function diffLabel(type) {
  if (type === "type") return "value type";
  return type;
}

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

function CompareOption({ checked, label, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">
      <input
        checked={checked}
        className="h-4 w-4 rounded border-zinc-300 accent-teal-700"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function selectedCompareSummary(options) {
  const selectedCount = Object.values(options).filter(Boolean).length;

  if (selectedCount === 3) return "All checks";
  if (selectedCount === 0) return "No checks";
  return `${selectedCount} check${selectedCount === 1 ? "" : "s"}`;
}

function LineDifferencePopover({ differences, lineNumber, onClose }) {
  return (
    <div className="absolute left-14 top-4 z-30 w-[min(28rem,calc(100%-4.5rem))] rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-950 shadow-2xl">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Line {lineNumber}</p>
          <p className="mt-1 text-xs text-rose-700">
            {differences.length} difference
            {differences.length === 1 ? "" : "s"} on this line
          </p>
        </div>
        <button
          className="rounded px-2 py-1 text-xs font-semibold text-rose-800 transition hover:bg-rose-100"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
      <ul className="max-h-56 space-y-2 overflow-auto text-xs">
        {differences.map((difference) => (
          <li
            className="rounded-md border border-rose-200 bg-white/70 p-2"
            key={`${difference.path}-${difference.type}`}
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded bg-rose-100 px-1.5 py-0.5 font-semibold uppercase text-rose-800">
                {diffLabel(difference.type)}
              </span>
              <span className="break-all font-mono text-rose-900">
                {difference.path}
              </span>
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              <code className="break-all rounded bg-rose-100 px-2 py-1 font-mono text-rose-950">
                Source: {difference.source}
              </code>
              <code className="break-all rounded bg-rose-100 px-2 py-1 font-mono text-rose-950">
                Target: {difference.target}
              </code>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function isContainerValue(value) {
  const type = valueType(value);
  return type === "object" || type === "array";
}

function getChildPath(parentPath, key, parentIsArray) {
  return parentIsArray ? `${parentPath}[${key}]` : `${parentPath}.${key}`;
}

function getDescendantDifferenceCount(path, differences) {
  if (path === "$") return differences.length;

  return differences.filter((difference) => {
    return (
      difference.path === path ||
      difference.path.startsWith(`${path}.`) ||
      difference.path.startsWith(`${path}[`)
    );
  }).length;
}

function containerLabel(value) {
  const type = valueType(value);
  const size = type === "array" ? value.length : Object.keys(value ?? {}).length;
  return type === "array" ? `Array(${size})` : `Object(${size})`;
}

function JsonTreeNode({
  depth,
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
  const descendantDifferenceCount = getDescendantDifferenceCount(
    path,
    differences,
  );
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
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-600 bg-zinc-900 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800"
                onClick={() => onToggle(path)}
                type="button"
              >
                {isExpanded ? "-" : "+"}
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
                : "text-zinc-100"
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
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-400"
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
            className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-400"
            style={{ marginLeft: `${Math.min(depth + 1, 8) * 14}px` }}
          >
            Nested preview paused at depth {maxTreeDepth}.
          </li>
        </ol>
      ) : null}
    </li>
  );
}

function HighlightPane({ data, differences, title }) {
  const [expandedPaths, setExpandedPaths] = useState(() => new Set(["$"]));

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
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-50">{title}</h3>
        <span className="text-xs font-medium text-zinc-400">
          Highlighted JSON
        </span>
      </div>
      <div className="max-h-[520px] overflow-auto p-3">
        <ol className="space-y-1 font-mono text-sm">
          <JsonTreeNode
            depth={0}
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

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 text-zinc-950">
          <section className="max-w-md rounded-lg border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-rose-950">
              JSON preview paused
            </h1>
            <p className="mt-2 text-sm leading-6 text-rose-800">
              The preview hit a browser rendering limit. The editor data is not
              saved locally, so reloading restores the safe demo workspace.
            </p>
            <button
              className="mt-4 w-full rounded-md bg-rose-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 sm:w-auto"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

function ThemeToggle({ onToggle, theme }) {
  const isDark = theme === "dark";

  return (
    <button
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-2 py-1.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400"
      onClick={onToggle}
      type="button"
    >
      <span className="text-xs">{isDark ? "Dark" : "Light"}</span>
      <span
        className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${
          isDark ? "bg-teal-700" : "bg-zinc-300"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
            isDark ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function AuthScreen({ onToggleTheme, theme }) {
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const isRegisterMode = authMode === "register";
  const isForgotMode = authMode === "forgot";

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthMessage("");

    if (!hasSupabaseConfig || !supabase) {
      setAuthMessage("Supabase is not configured. Check your Vite env values.");
      return;
    }

    setAuthLoading(true);

    if (isForgotMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      setAuthLoading(false);

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      setAuthMessage("Password reset link sent. Check your email.");
      return;
    }

    const authResponse = isRegisterMode
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setAuthLoading(false);

    if (authResponse.error) {
      setAuthMessage(authResponse.error.message);
      return;
    }

    if (isRegisterMode && !authResponse.data.session) {
      setAuthMessage("Registration created. Check your email to confirm login.");
      return;
    }

    setAuthMessage("");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-8 text-zinc-950">
      <section className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/60 sm:p-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle onToggle={onToggleTheme} theme={theme} />
        </div>

        <form onSubmit={handleAuthSubmit}>
          <div className="mb-8 flex justify-center pt-6">
            <img
              alt="JSON Compare logo"
              className="h-16 w-56 object-contain"
              src={logo}
            />
          </div>

          <div className="mb-6 flex rounded-lg bg-zinc-100 p-1">
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                !isRegisterMode
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
              onClick={() => {
                setAuthMode("login");
                setAuthMessage("");
              }}
              type="button"
            >
              Login
            </button>
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                isRegisterMode
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
              onClick={() => {
                setAuthMode("register");
                setAuthMessage("");
              }}
              type="button"
            >
              Register
            </button>
          </div>

          <h1 className="text-center text-2xl font-semibold tracking-tight text-zinc-950">
            {isForgotMode
              ? "Reset password"
              : isRegisterMode
                ? "Create account"
                : "Welcome back"}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-center text-sm text-zinc-500">
            {isForgotMode
              ? "Enter your email and we will send a password reset link."
              : "Use your email address and password to continue."}
          </p>

            <label className="mt-6 block text-sm font-semibold text-zinc-800">
              Email
              <input
                autoComplete="email"
                className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            {!isForgotMode ? (
              <label className="mt-4 block text-sm font-semibold text-zinc-800">
                Password
                <input
                  autoComplete={
                    isRegisterMode ? "new-password" : "current-password"
                  }
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  required
                  type="password"
                  value={password}
                />
              </label>
            ) : null}

            {!isRegisterMode ? (
              <button
                className="mt-3 text-sm font-semibold text-teal-700 transition hover:text-teal-900"
                onClick={() => {
                  setAuthMode(isForgotMode ? "login" : "forgot");
                  setAuthMessage("");
                }}
                type="button"
              >
                {isForgotMode ? "Back to login" : "Forgot password?"}
              </button>
            ) : null}

            {authMessage ? (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {authMessage}
              </p>
            ) : null}

            {!hasSupabaseConfig ? (
              <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                Missing Supabase environment values.
              </p>
            ) : null}

            <button
              className="mt-6 w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              disabled={authLoading || !hasSupabaseConfig}
              type="submit"
            >
              {authLoading
                ? "Please wait..."
                : isForgotMode
                  ? "Send reset link"
                  : isRegisterMode
                    ? "Register"
                    : "Login"}
            </button>
        </form>
      </section>
    </main>
  );
}

function ProfileDialog({ onClose, session }) {
  const [displayName, setDisplayName] = useState(
    session.user.user_metadata?.display_name ?? "",
  );
  const [newPassword, setNewPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileMessage("");

    if (!supabase) {
      setProfileMessage("Supabase is not configured.");
      return;
    }

    const updates = {
      data: { display_name: displayName.trim() },
    };

    if (newPassword) {
      updates.password = newPassword;
    }

    setProfileLoading(true);
    const { error } = await supabase.auth.updateUser(updates);
    setProfileLoading(false);

    if (error) {
      setProfileMessage(error.message);
      return;
    }

    setNewPassword("");
    setProfileMessage("Profile updated.");
  }

  return (
    <div
      aria-labelledby="profile-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-2 py-3 sm:px-4 sm:py-6"
      role="dialog"
    >
      <form
        className="max-h-[94vh] w-full max-w-lg overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 shadow-2xl"
        onSubmit={handleProfileSubmit}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div>
            <h2
              className="text-lg font-semibold text-zinc-950"
              id="profile-dialog-title"
            >
              Manage profile
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{session.user.email}</p>
          </div>
          <button
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <label className="block text-sm font-semibold text-zinc-800">
            Display name
            <input
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
              type="text"
              value={displayName}
            />
          </label>

          <label className="block text-sm font-semibold text-zinc-800">
            New password
            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              minLength={6}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Leave blank to keep current password"
              type="password"
              value={newPassword}
            />
          </label>

          {profileMessage ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {profileMessage}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end border-t border-zinc-200 px-5 py-4">
          <button
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={profileLoading}
            type="submit"
          >
            {profileLoading ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
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
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase));
  const [session, setSession] = useState(null);
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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");

    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // Theme preference is optional.
    }
  }, [theme]);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setAuthLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setAuthLoading(false);
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

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

  function updateSourceJson(value) {
    setSourceJson(value);
  }

  function updateTargetJson(value) {
    setTargetJson(value);
  }

  function formatInputs() {
    if (!sourceResult.error && !sourceResult.empty) {
      updateSourceJson(JSON.stringify(sourceResult.data, null, 2));
    }
    if (!targetResult.error && !targetResult.empty) {
      updateTargetJson(JSON.stringify(targetResult.data, null, 2));
    }
  }

  function clearInputs() {
    updateSourceJson("");
    updateTargetJson("");
  }

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  if (authLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 text-zinc-600">
        <p className="text-sm font-medium">Checking session...</p>
      </main>
    );
  }

  if (!session) {
    return <AuthScreen onToggleTheme={toggleTheme} theme={theme} />;
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-3 py-5 text-zinc-950 sm:px-4">
      <div className="flex w-full flex-col gap-5">
        <header className="flex flex-col gap-4  pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <img
                alt="JSON Compare logo"
                className="h-14 w-36 rounded-lg object-contain sm:h-18 sm:w-48"
                src={logo}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <button
              className="rounded-md border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200"
              onClick={clearInputs}
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
                className="flex w-full min-w-0 items-center justify-between gap-3 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 sm:w-64"
                onClick={() => setAccountMenuOpen((open) => !open)}
                type="button"
              >
                <span className="truncate">{session.user.email}</span>
                <span aria-hidden="true" className="text-zinc-500">
                  ▾
                </span>
              </button>
              {accountMenuOpen ? (
                <div className="absolute right-0 top-11 z-40 w-full rounded-lg border border-zinc-200 bg-white p-2 shadow-xl sm:w-72">
                  <div className="border-b border-zinc-100 px-2 pb-2">
                    <p className="truncate text-sm font-semibold text-zinc-950">
                      {session.user.email}
                    </p>
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
                      <ThemeToggle onToggle={toggleTheme} theme={theme} />
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
            <div className="relative">
              <button
                aria-expanded={compareMenuOpen}
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 sm:w-auto"
                onClick={() => setCompareMenuOpen((open) => !open)}
                type="button"
              >
                Compare settings
              </button>
              {compareMenuOpen ? (
                <div className="absolute left-0 top-11 z-40 w-[calc(100vw-1.5rem)] max-w-80 rounded-lg border border-zinc-200 bg-white p-2 shadow-xl sm:left-auto sm:right-0 sm:w-72">
                  <div className="border-b border-zinc-100 px-2 pb-2">
                    <p className="text-sm font-semibold text-zinc-950">
                      Compare settings
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Controls what gets highlighted and listed.
                    </p>
                  </div>
                  <div className="mt-2 space-y-1">
                    <CompareOption
                      checked={compareOptions.key}
                      label="Compare Key"
                      onChange={(checked) =>
                        updateCompareOption("key", checked)
                      }
                    />
                    <CompareOption
                      checked={compareOptions.valueType}
                      label="Compare Value Type"
                      onChange={(checked) =>
                        updateCompareOption("valueType", checked)
                      }
                    />
                    <CompareOption
                      checked={compareOptions.value}
                      label="Compare Value (including value)"
                      onChange={(checked) =>
                        updateCompareOption("value", checked)
                      }
                    />
                    <CompareOption
                      checked={compareAll}
                      label="Compare all"
                      onChange={updateCompareAll}
                    />
                  </div>
                </div>
              ) : null}
            </div>
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
          {[
            {
              id: "source",
              label: "Source JSON",
              value: sourceJson,
              setValue: updateSourceJson,
              lineDifferences: sourceLineDifferences,
              result: sourceResult,
              description: "Original or baseline payload",
            },
            {
              id: "target",
              label: "Target JSON",
              value: targetJson,
              setValue: updateTargetJson,
              lineDifferences: targetLineDifferences,
              result: targetResult,
              description: "Payload to compare against the source",
            },
          ].map((panel) => (
            <div
              className="flex min-h-[460px] flex-col rounded-lg border border-zinc-200 bg-zinc-100 sm:min-h-[560px] lg:min-h-[660px]"
              key={panel.label}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950">
                    {panel.label}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {panel.description}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(
                    panel.result,
                  )}`}
                >
                  {statusLabel(panel.result)}
                </span>
              </div>

              <div
                className="relative grid min-h-[360px] flex-1 grid-cols-[2.75rem_1fr] overflow-hidden bg-white sm:min-h-[460px] sm:grid-cols-[3.25rem_1fr] lg:min-h-[560px]"
                onMouseLeave={() => setActiveLinePopup(null)}
              >
                <div className="overflow-hidden border-r border-zinc-200 bg-zinc-100 px-3 py-4 text-right font-mono text-sm leading-6 text-zinc-500">
                  <div
                    style={{
                      transform: `translateY(-${editorScroll[panel.id]}px)`,
                    }}
                  >
                    {getLineNumbers(panel.value).map((lineNumber) => {
                      const lineDifferences =
                        panel.lineDifferences.get(lineNumber);
                      const isDangerLine = Boolean(lineDifferences);

                      if (!isDangerLine) {
                        return (
                          <div className="h-6 tabular-nums" key={lineNumber}>
                            {lineNumber}
                          </div>
                        );
                      }

                      return (
                        <button
                          aria-label={`${panel.label} line ${lineNumber} differences`}
                          className="-mx-2 h-6 w-[calc(100%+1rem)] rounded bg-rose-700 px-2 text-right tabular-nums text-rose-50 outline-none transition hover:bg-rose-600 focus:bg-rose-600 focus:ring-2 focus:ring-rose-300"
                          key={lineNumber}
                          onClick={() =>
                            setActiveLinePopup({
                              panelId: panel.id,
                              lineNumber,
                              differences: lineDifferences,
                            })
                          }
                          onFocus={() =>
                            setActiveLinePopup({
                              panelId: panel.id,
                              lineNumber,
                              differences: lineDifferences,
                            })
                          }
                          onMouseEnter={() =>
                            setActiveLinePopup({
                              panelId: panel.id,
                              lineNumber,
                              differences: lineDifferences,
                            })
                          }
                          type="button"
                        >
                          {lineNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <textarea
                  aria-label={panel.label}
                  className="min-h-[360px] flex-1 resize-y border-0 bg-white p-3 font-mono text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-teal-400 sm:min-h-[460px] sm:p-4 lg:min-h-[560px]"
                  onChange={(event) => panel.setValue(event.target.value)}
                  onScroll={(event) =>
                    setEditorScroll((current) => ({
                      ...current,
                      [panel.id]: event.currentTarget.scrollTop,
                    }))
                  }
                  placeholder={`Paste ${panel.label.toLowerCase()} here`}
                  spellCheck="false"
                  value={panel.value}
                />
                {activeLinePopup?.panelId === panel.id ? (
                  <LineDifferencePopover
                    differences={activeLinePopup.differences}
                    lineNumber={activeLinePopup.lineNumber}
                    onClose={() => setActiveLinePopup(null)}
                  />
                ) : null}
              </div>

              {panel.result.error ? (
                <p className="border-t border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {panel.result.error}
                </p>
              ) : null}
            </div>
          ))}
        </section>

        {highlightDialogOpen ? (
          <div
            aria-labelledby="highlight-dialog-title"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-2 py-3 sm:px-4 sm:py-6"
            role="dialog"
          >
            <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg bg-zinc-50 shadow-2xl sm:max-h-[90vh]">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
                <div>
                  <h2
                    className="text-lg font-semibold text-zinc-950"
                    id="highlight-dialog-title"
                  >
                    Highlighted JSON
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Hover or focus a highlighted row to inspect the difference.
                  </p>
                </div>
                <button
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
                  onClick={() => setHighlightDialogOpen(false)}
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className="overflow-auto p-2 sm:p-4">
                {canCompare ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <HighlightPane
                      data={sourceResult.data}
                      differences={differences}
                      title="Source JSON highlights"
                    />
                    <HighlightPane
                      data={targetResult.data}
                      differences={differences}
                      title="Target JSON highlights"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600">
                    Add valid JSON to both inputs to view highlights.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {profileDialogOpen ? (
          <ProfileDialog
            onClose={() => setProfileDialogOpen(false)}
            session={session}
          />
        ) : null}

        {diffDialogOpen ? (
          <div
            aria-labelledby="diff-dialog-title"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-2 py-3 sm:px-4 sm:py-6"
            role="dialog"
          >
            <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-zinc-50 shadow-2xl sm:max-h-[86vh]">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
                <div>
                  <h2
                    className="text-lg font-semibold text-zinc-950"
                    id="diff-dialog-title"
                  >
                    Differences
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {differences.length} difference
                    {differences.length === 1 ? "" : "s"} found
                  </p>
                </div>
                <button
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
                  onClick={() => setDiffDialogOpen(false)}
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className="overflow-auto">
                {differences.length === 0 ? (
                  <p className="px-5 py-6 text-sm font-medium text-emerald-700">
                    {hasSelectedCompareOption
                      ? "No differences found for the selected compare options."
                      : "Select at least one compare option to view differences."}
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-200">
                    {differences.map((difference, index) => (
                      <li
                        className="grid gap-3 px-5 py-4 lg:grid-cols-[180px_1fr_1fr]"
                        key={`${difference.path}-${index}`}
                      >
                        <div>
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold uppercase ${diffBadgeClass(
                              difference.type,
                            )}`}
                          >
                            {diffLabel(difference.type)}
                          </span>
                          <p className="mt-2 break-all font-mono text-xs text-zinc-600">
                            {difference.path}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            Source
                          </p>
                          <code className="block break-all rounded bg-zinc-100 px-3 py-2 font-mono text-sm text-zinc-800">
                            {difference.source}
                          </code>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            Target
                          </p>
                          <code className="block break-all rounded bg-zinc-100 px-3 py-2 font-mono text-sm text-zinc-800">
                            {difference.target}
                          </code>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function Root() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
