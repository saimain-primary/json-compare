import { LineDifferencePopover } from "./LineDifferencePopover";

export function JsonEditorPanel({
  activeLinePopup,
  editorScroll,
  getLineNumbers,
  onActiveLinePopupChange,
  onEditorScrollChange,
  panel,
  readOnly = false,
  statusClass,
  statusLabel,
}) {
  return (
    <div className="flex min-h-[460px] flex-col gap-2 sm:min-h-[560px] lg:min-h-[660px]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-zinc-950">
            {panel.label}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">{panel.description}</p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
            panel.loading
              ? "bg-zinc-100 text-zinc-500 ring-zinc-200"
              : statusClass(panel.result)
          }`}
        >
          {panel.loading ? "Loading…" : statusLabel(panel.result)}
        </span>
      </div>

      <div
        className="relative grid min-h-[360px] flex-1 grid-cols-[2.75rem_1fr] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm sm:min-h-[460px] sm:grid-cols-[3.25rem_1fr] lg:min-h-[560px]"
        onMouseLeave={() => onActiveLinePopupChange(null)}
      >
        <div className="overflow-hidden border-r border-zinc-200 bg-zinc-100 px-3 py-4 text-right font-mono text-sm leading-6 text-zinc-500">
          <div
            style={{
              transform: `translateY(-${editorScroll[panel.id]}px)`,
            }}
          >
            {getLineNumbers(panel.value).map((lineNumber) => {
              const lineDifferences = panel.lineDifferences.get(lineNumber);
              const isDangerLine = Boolean(lineDifferences);

              if (!isDangerLine) {
                return (
                  <div className="h-6 tabular-nums" key={lineNumber}>
                    {lineNumber}
                  </div>
                );
              }

              const popup = {
                panelId: panel.id,
                lineNumber,
                differences: lineDifferences,
              };

              return (
                <button
                  aria-label={`${panel.label} line ${lineNumber} differences`}
                  className="-mx-2 h-6 w-[calc(100%+1rem)] rounded bg-rose-700 px-2 text-right tabular-nums text-rose-50 outline-none transition hover:bg-rose-600 focus:bg-rose-600 focus:ring-2 focus:ring-rose-300"
                  key={lineNumber}
                  onClick={() => onActiveLinePopupChange(popup)}
                  onFocus={() => onActiveLinePopupChange(popup)}
                  onMouseEnter={() => onActiveLinePopupChange(popup)}
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
          className="min-h-[360px] flex-1 resize-y border-0 bg-white p-3 font-mono text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-violet-400 sm:min-h-[460px] sm:p-4 lg:min-h-[560px]"
          onChange={(event) => {
            if (!readOnly) {
              panel.setValue(event.target.value);
            }
          }}
          onScroll={(event) => {
            const el = event.currentTarget;
            if (!el) return;
            const scrollTop = el.scrollTop;
            onEditorScrollChange((current) => ({
              ...current,
              [panel.id]: scrollTop,
            }));
          }}
          placeholder={`Paste ${panel.label.toLowerCase()} here`}
          readOnly={readOnly}
          spellCheck="false"
          value={panel.value}
        />
        {activeLinePopup?.panelId === panel.id ? (
          <LineDifferencePopover
            differences={activeLinePopup.differences}
            lineNumber={activeLinePopup.lineNumber}
            onClose={() => onActiveLinePopupChange(null)}
          />
        ) : null}
      </div>

      {panel.result.error ? (
        <p className="border-t border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {panel.result.error}
        </p>
      ) : null}
    </div>
  );
}
