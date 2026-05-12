import { useState } from "react";
import logo from "../assets/logo.png";
import { GoogleAuthButton } from "../components/common/GoogleAuthButton";
import { signInWithGoogle } from "../lib/auth";
import { hasSupabaseConfig } from "../supabaseClient";

export function AuthPage() {
  const [authMessage, setAuthMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setAuthMessage("");
    setGoogleLoading(true);

    const { error } = await signInWithGoogle();

    if (error) {
      setAuthMessage(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-8 text-zinc-950">
      <section className="relative w-full max-w-md rounded-xl  bg-white p-6 sm:p-8">
        <div>
          <div className="mb-8 flex justify-center pt-6">
            <img
              alt="Blame the API logo"
              className="h-16 w-56 object-contain"
              src={logo}
            />
          </div>

          <div className="space-y-3 text-center">
            <h1 className="text-2xl font-bold text-zinc-950">
              Sign in to Blame the API
            </h1>
            <p className="text-sm leading-6 text-zinc-600">
              Continue with Google and find out who changed the JSON.
            </p>
          </div>

          {authMessage ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {authMessage}
            </p>
          ) : null}

          {!hasSupabaseConfig ? (
            <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Missing Supabase environment values.
            </p>
          ) : null}

          <GoogleAuthButton
            disabled={!hasSupabaseConfig}
            loading={googleLoading}
            onClick={handleGoogleLogin}
          />
        </div>
      </section>
    </main>
  );
}
