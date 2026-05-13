import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { ProfileDialog } from "../components/profile/ProfileDialog";
import { useCollections } from "../hooks/useCollections";
import { supabase } from "../supabaseClient";

export function AppShell() {
  const { onToggleTheme, session, theme } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [compareActions, setCompareActions] = useState(null);
  const [compareTabs, setCompareTabs] = useState([]);
  const {
    collections,
    collectionsLoading,
    createCollection,
    creatingCollection,
    deleteCollection,
    renameCollection,
  } = useCollections(session.user.id);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  const activeCompareId = useMemo(() => {
    const match = location.pathname.match(
      /^\/collections\/[^/]+\/compares\/([^/]+)/,
    );
    return match?.[1] ?? "";
  }, [location.pathname]);

  const activeCollectionId = useMemo(() => {
    const match = location.pathname.match(/^\/collections\/([^/]+)/);
    return match?.[1] ?? "";
  }, [location.pathname]);

  const activeCollectionName = useMemo(() => {
    const activeCollection = collections.find(
      (collection) => collection.id === activeCollectionId,
    );
    return activeCollection?.name ?? "Who Changed the Response";
  }, [activeCollectionId, collections]);

  const openCompareTab = useCallback((compare) => {
    if (!compare?.id || !compare?.collectionId || !compare?.name) return;

    setCompareTabs((currentTabs) => {
      const existingIndex = currentTabs.findIndex((tab) => tab.id === compare.id);
      if (existingIndex === -1) return [...currentTabs, compare];

      return currentTabs.map((tab, index) =>
        index === existingIndex ? { ...tab, ...compare } : tab,
      );
    });
  }, []);

  const closeCompareTab = useCallback(
    (tabId) => {
      setCompareTabs((currentTabs) => {
        const closingIndex = currentTabs.findIndex((tab) => tab.id === tabId);
        if (closingIndex === -1) return currentTabs;

        const closingTab = currentTabs[closingIndex];
        const nextTabs = currentTabs.filter((tab) => tab.id !== tabId);

        if (tabId === activeCompareId) {
          const nextTab = nextTabs[closingIndex] ?? nextTabs[closingIndex - 1];
          if (nextTab) {
            navigate(
              `/collections/${nextTab.collectionId}/compares/${nextTab.id}`,
            );
          } else {
            navigate(`/collections/${closingTab.collectionId}`);
          }
        }

        return nextTabs;
      });
    },
    [activeCompareId, navigate],
  );

  return (
    <AppLayout
      accountMenuOpen={accountMenuOpen}
      activeCollectionName={activeCollectionName}
      activeCompareId={activeCompareId}
      collections={collections}
      collectionsLoading={collectionsLoading}
      compareTabs={compareTabs}
      createCollection={createCollection}
      creatingCollection={creatingCollection}
      deleteCollection={deleteCollection}
      renameCollection={renameCollection}
      onClearJson={compareActions?.onClearJson}
      onFormatJson={compareActions?.onFormatJson}
      onLogout={handleLogout}
      onCloseCompareTab={closeCompareTab}
      onOpenCompareTab={openCompareTab}
      onOpenProfile={() => {
        setProfileDialogOpen(true);
        setAccountMenuOpen(false);
      }}
      onToggleAccountMenu={() => setAccountMenuOpen((open) => !open)}
      onToggleTheme={onToggleTheme}
      outletContext={{
        compareToolbar: compareActions?.toolbar,
        openCompareTab,
        session,
        setCompareActions,
      }}
      session={session}
      showCompareActions={Boolean(compareActions)}
      theme={theme}
    >
      {profileDialogOpen ? (
        <ProfileDialog
          onClose={() => setProfileDialogOpen(false)}
          session={session}
        />
      ) : null}
    </AppLayout>
  );
}
