import { AppErrorBoundary } from "./components/common/AppErrorBoundary";
import { useSupabaseSession } from "./hooks/useSupabaseSession";
import { useTheme } from "./hooks/useTheme";
import { AuthPage } from "./pages/AuthPage";
import { JsonComparePage } from "./pages/JsonComparePage";
import { OAuthConsentPage } from "./pages/OAuthConsentPage";

function App() {
  const isConsentPath = window.location.pathname === "/oauth/consent";
  const { theme, toggleTheme } = useTheme();
  const { authLoading, session } = useSupabaseSession();

  if (authLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 text-zinc-600">
        <p className="text-sm font-medium">Checking session...</p>
      </main>
    );
  }

  if (isConsentPath) {
    return (
      <OAuthConsentPage
        onToggleTheme={toggleTheme}
        session={session}
        theme={theme}
      />
    );
  }

  if (!session) {
    return <AuthPage onToggleTheme={toggleTheme} theme={theme} />;
  }

  return (
    <JsonComparePage
      onToggleTheme={toggleTheme}
      session={session}
      theme={theme}
    />
  );
}

export default function Root() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
