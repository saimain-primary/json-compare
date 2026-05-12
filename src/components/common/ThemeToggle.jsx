export function ThemeToggle({ onToggle, theme }) {
  const isDark = theme === "dark";

  return (
    <button
      aria-pressed={isDark}
      className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-2 py-1 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
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
