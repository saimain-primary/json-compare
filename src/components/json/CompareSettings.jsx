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

export function CompareSettings({
  compareAll,
  compareMenuOpen,
  compareOptions,
  onToggleAll,
  onToggleMenu,
  onToggleOption,
}) {
  return (
    <div className="relative">
      <button
        aria-expanded={compareMenuOpen}
        className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 sm:w-auto"
        onClick={onToggleMenu}
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
              onChange={(checked) => onToggleOption("key", checked)}
            />
            <CompareOption
              checked={compareOptions.valueType}
              label="Compare Value Type"
              onChange={(checked) => onToggleOption("valueType", checked)}
            />
            <CompareOption
              checked={compareOptions.value}
              label="Compare Value (including value)"
              onChange={(checked) => onToggleOption("value", checked)}
            />
            <CompareOption
              checked={compareAll}
              label="Compare all"
              onChange={onToggleAll}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
