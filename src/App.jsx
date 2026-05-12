import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppErrorBoundary } from "./components/common/AppErrorBoundary";
import { useSupabaseSession } from "./hooks/useSupabaseSession";
import { useTheme } from "./hooks/useTheme";
import { AppShell } from "./pages/AppShell";
import { LandingPage } from "./pages/LandingPage";
import { CollectionComparesPage } from "./pages/CollectionComparesPage";
import { CompareWorkspacePage } from "./pages/CompareWorkspacePage";
import { OAuthConsentPage } from "./pages/OAuthConsentPage";

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
                <p className="text-sm text-zinc-400">
                  Select a collection from the sidebar.
                </p>
              }
            />
            <Route
              path="/collections/:collectionId"
              element={<CollectionComparesPage />}
            />
            <Route
              path="/collections/:collectionId/compares/:compareId"
              element={<CompareWorkspacePage />}
            />
          </Route>
        </Route>

        <Route path="/" element={<LandingPage session={session} />} />
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
