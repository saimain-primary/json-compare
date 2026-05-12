import { useState } from "react";
import logo from "../assets/logo.png";
import { GoogleAuthButton } from "../components/common/GoogleAuthButton";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { getAuthRedirectUrl, signInWithGoogle } from "../lib/auth";
import { hasSupabaseConfig } from "../supabaseClient";

export function OAuthConsentPage({ onToggleTheme, session, theme }) {
  const [message, setMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleConsent() {
    setMessage("");
    setGoogleLoading(true);

    const { error } = await signInWithGoogle();

    if (error) {
      setMessage(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-8 text-zinc-950">
      <section className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/60 sm:p-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle onToggle={onToggleTheme} theme={theme} />
        </div>

        <div className="mb-8 flex justify-center pt-6">
          <img
            alt="Blame the API logo"
            className="h-16 w-56 object-contain"
            src={logo}
          />
        </div>

        <div className="space-y-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
            Google authorization
          </p>
          <h1 className="text-2xl font-bold text-zinc-950">
            Sign in to Blame the API
          </h1>
          <p className="text-sm leading-6 text-zinc-600">
            Continue with your Google account to authorize access and return to
            the compare workspace.
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">
            Blame the API will use:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li>Email address for your account.</li>
            <li>Basic Google profile details for sign-in.</li>
            <li>Supabase session storage for secure authentication.</li>
          </ul>
        </div>

        {message ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {message}
          </p>
        ) : null}

        {session ? (
          <button
            className="mt-6 w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800"
            onClick={() => {
              window.location.href = getAuthRedirectUrl();
            }}
            type="button"
          >
            Open Blame the API
          </button>
        ) : (
          <GoogleAuthButton
            disabled={!hasSupabaseConfig}
            loading={googleLoading}
            onClick={handleGoogleConsent}
          />
        )}

        {!hasSupabaseConfig ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Missing Supabase environment values.
          </p>
        ) : null}
      </section>
    </main>
  );
}
