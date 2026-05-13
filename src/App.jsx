import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { Boxes } from "lucide-react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppErrorBoundary } from "./components/common/AppErrorBoundary";
import { useSupabaseSession } from "./hooks/useSupabaseSession";
import { useTheme } from "./hooks/useTheme";
import { AppShell } from "./pages/AppShell";
import { AuthPage } from "./pages/AuthPage";
import { LandingPage } from "./pages/LandingPage";
import { CollectionComparesPage } from "./pages/CollectionComparesPage";
import { CompareWorkspacePage } from "./pages/CompareWorkspacePage";
import { OAuthConsentPage } from "./pages/OAuthConsentPage";
import { PublicSharedCollectionPage } from "./pages/PublicSharedCollectionPage";
import { PublicSharedComparePage } from "./pages/PublicSharedComparePage";

function CompareWorkspaceRoute() {
  const { compareId } = useParams();
  return <CompareWorkspacePage key={compareId} />;
}

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 text-zinc-600">
      <p className="text-sm font-medium">Checking session...</p>
    </main>
  );
}

function AppRoutes() {
  const { theme, toggleTheme } = useTheme();
  const { authLoading, session } = useSupabaseSession();
  const routeContext = {
    onToggleTheme: toggleTheme,
    session,
    theme,
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route element={<Outlet context={routeContext} />}>
        <Route
          path="/oauth/consent"
          element={
            <OAuthConsentPage
              onToggleTheme={toggleTheme}
              session={session}
              theme={theme}
            />
          }
        />

        <Route element={<ProtectedRoute session={session} />}>
          <Route element={<AppShell />}>
            <Route
              path="/collections"
              element={
                <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
                  <Boxes aria-hidden="true" className="text-zinc-300" size={40} />
                  <p className="mt-4 text-base font-semibold text-zinc-950">
                    No collection selected
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Select a collection from the sidebar.
                  </p>
                </div>
              }
            />
            <Route
              path="/collections/:collectionId"
              element={<CollectionComparesPage />}
            />
            <Route
              path="/collections/:collectionId/compares/:compareId"
              element={<CompareWorkspaceRoute />}
            />
          </Route>
        </Route>

        <Route path="/" element={<LandingPage session={session} />} />
        <Route path="/login" element={<AuthPage session={session} />} />
        <Route
          path="/shared/collections/:token"
          element={<PublicSharedCollectionPage />}
        />
        <Route
          path="/shared/collections/:collectionToken/compares/:compareId"
          element={<PublicSharedComparePage />}
        />
        <Route path="/shared/:token" element={<PublicSharedComparePage />} />
        <Route
          path="*"
          element={
            <Navigate replace to={session ? "/collections" : "/"} />
          }
        />
      </Route>
    </Routes>
  );
}

export default function Root() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
