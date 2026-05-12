import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { ProfileDialog } from "../components/profile/ProfileDialog";
import { useCollections } from "../hooks/useCollections";
import { supabase } from "../supabaseClient";

export function AppShell() {
  const { onToggleTheme, session, theme } = useOutletContext();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [compareActions, setCompareActions] = useState(null);
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

  return (
    <AppLayout
      accountMenuOpen={accountMenuOpen}
      collections={collections}
      collectionsLoading={collectionsLoading}
      createCollection={createCollection}
      creatingCollection={creatingCollection}
      deleteCollection={deleteCollection}
      renameCollection={renameCollection}
      onClearJson={compareActions?.onClearJson}
      onFormatJson={compareActions?.onFormatJson}
      onLogout={handleLogout}
      onOpenProfile={() => {
        setProfileDialogOpen(true);
        setAccountMenuOpen(false);
      }}
      onToggleAccountMenu={() => setAccountMenuOpen((open) => !open)}
      onToggleTheme={onToggleTheme}
      outletContext={{ session, setCompareActions }}
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
