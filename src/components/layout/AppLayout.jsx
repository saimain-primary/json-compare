import { Boxes, FileJson, Trash2 } from "lucide-react";
import { Outlet } from "react-router-dom";
import logo from "../../assets/logo.png";
import { AccountMenu } from "./AccountMenu";
import { AppSidebar } from "./AppSidebar";
import { EditorTabs } from "./EditorTabs";

export function AppLayout({
  accountMenuOpen,
  activeCollectionName,
  activeCompareId,
  children,
  collections,
  collectionsLoading,
  compareTabs,
  createCollection,
  creatingCollection,
  deleteCollection,
  onClearJson,
  onCloseCompareTab,
  onFormatJson,
  onLogout,
  onOpenCompareTab,
  onOpenProfile,
  onToggleAccountMenu,
  onToggleTheme,
  outletContext,
  renameCollection,
  session,
  showCompareActions,
  theme,
}) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 lg:flex">
      <AppSidebar
        collections={collections}
        collectionsLoading={collectionsLoading}
        createCollection={createCollection}
        creatingCollection={creatingCollection}
        deleteCollection={deleteCollection}
        onOpenCompareTab={onOpenCompareTab}
        renameCollection={renameCollection}
        userId={session.user.id}
      />

      <section className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <img
            alt="Who Changed the Response logo"
            className="h-10 w-36 object-contain"
            src={logo}
          />
        </header>

        {/* Topbar */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
            <Boxes aria-hidden="true" size={16} />
            <span className="max-w-64 truncate">{activeCollectionName}</span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {showCompareActions ? (
              <>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200"
                  onClick={onClearJson}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={16} />
                  Clear
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400"
                  onClick={onFormatJson}
                  type="button"
                >
                  <FileJson aria-hidden="true" size={16} />
                  Format JSON
                </button>
              </>
            ) : null}
            <AccountMenu
              menuOpen={accountMenuOpen}
              onLogout={onLogout}
              onOpenProfile={onOpenProfile}
              onToggleMenu={onToggleAccountMenu}
              onToggleTheme={onToggleTheme}
              session={session}
              theme={theme}
            />
          </div>
        </div>

        <EditorTabs
          activeCompareId={activeCompareId}
          actions={outletContext?.compareToolbar}
          onCloseTab={onCloseCompareTab}
          tabs={compareTabs}
        />

        {/* Page content */}
        <div className="min-w-0 flex-1 overflow-auto px-4 py-1">
          <Outlet context={outletContext} />
          {children}
        </div>
      </section>
    </main>
  );
}
