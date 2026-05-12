import { LogOut, User } from "lucide-react";
import { ThemeToggle } from "../common/ThemeToggle";
import {
  getUserAvatarUrl,
  getUserDisplayName,
  getUserInitials,
} from "./userProfile";

export function AccountMenu({
  menuOpen,
  onLogout,
  onOpenProfile,
  onToggleMenu,
  onToggleTheme,
  placement = "bottom",
  session,
  theme,
}) {
  const accountLabel = getUserDisplayName(session.user);
  const accountAvatarUrl = getUserAvatarUrl(session.user);
  const accountInitials = getUserInitials(accountLabel);

  return (
    <div className="relative justify-self-end">
      <button
        aria-expanded={menuOpen}
        aria-label="Open profile menu"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white p-0.5 shadow-sm transition hover:border-zinc-400"
        onClick={onToggleMenu}
        type="button"
      >
        {accountAvatarUrl ? (
          <img
            alt=""
            className="h-7 w-7 rounded-full object-cover ring-1 ring-zinc-200"
            src={accountAvatarUrl}
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-700 text-xs font-bold text-white ring-1 ring-violet-800">
            {accountInitials}
          </span>
        )}
      </button>

      {menuOpen ? (
        <div
          className={`absolute right-0 z-40 w-72 rounded-lg border border-zinc-200 bg-white p-2 shadow-xl ${
            placement === "top" ? "bottom-12" : "top-12"
          }`}
        >
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
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
              onClick={onOpenProfile}
              type="button"
            >
              <User aria-hidden="true" size={16} />
              Profile
            </button>
            <div className="flex items-center justify-between rounded-md px-2 py-2">
              <span className="text-sm font-medium text-zinc-800">Theme</span>
              <ThemeToggle onToggle={onToggleTheme} theme={theme} />
            </div>
            <button
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50"
              onClick={onLogout}
              type="button"
            >
              <LogOut aria-hidden="true" size={16} />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
