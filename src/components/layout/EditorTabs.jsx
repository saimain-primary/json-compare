import { X } from "lucide-react";
import { NavLink } from "react-router-dom";

export function EditorTabs({ activeCompareId, actions, onCloseTab, tabs }) {
  if (tabs.length === 0 && !actions) return null;

  return (
    <div className="flex min-h-9 items-end justify-between gap-2 border-b border-zinc-200 bg-zinc-100 mb-2">
      <div className="scrollbar-none flex min-w-0 flex-1 items-end overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.id === activeCompareId;

          return (
            <div
              className={`group flex max-w-64 shrink-0 items-center ${
                active
                  ? "border-zinc-200 bg-zinc-50 text-zinc-950"
                  : "border-transparent bg-zinc-100 text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-800"
              }`}
              key={tab.id}
            >
              <NavLink
                className="min-w-0 truncate px-3 py-2 text-xs font-semibold"
                title={tab.name}
                to={`/collections/${tab.collectionId}/compares/${tab.id}`}
              >
                {tab.name}
              </NavLink>
              <button
                aria-label={`Close ${tab.name}`}
                className={`mr-1 rounded p-1 transition ${
                  active
                    ? "text-zinc-500 hover:text-zinc-950"
                    : "text-zinc-400 opacity-0 hover:text-zinc-800 group-hover:opacity-100"
                }`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onCloseTab(tab.id);
                }}
                type="button"
              >
                <X aria-hidden="true" size={13} />
              </button>
            </div>
          );
        })}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-1 px-2 py-1">{actions}</div>
      ) : null}
    </div>
  );
}
