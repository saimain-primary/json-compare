import { useState } from "react";
import { Navigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { EmailPasswordAuthForm } from "../components/auth/EmailPasswordAuthForm";
import { GoogleAuthButton } from "../components/common/GoogleAuthButton";
import { signInWithGoogle } from "../lib/auth";
import { hasSupabaseConfig } from "../supabaseClient";

export function AuthPage({ session }) {
  const [authMessage, setAuthMessage] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (session) {
    return <Navigate replace to="/collections" />;
  }

  async function handleGoogleLogin() {
    setAuthMessage(null);
    setGoogleLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setAuthMessage({ tone: "error", text: error.message });
        setGoogleLoading(false);
      }
    } catch (error) {
      setAuthMessage({
        tone: "error",
        text: error?.message || "Google sign-in failed. Please try again.",
      });
      setGoogleLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-8 text-zinc-950">
      <section className="relative w-full max-w-md rounded-xl  bg-white p-6 sm:p-8">
        <div>
          <div className="mb-8 flex justify-center pt-6">
            <img
              alt="Who Changed the Response logo"
              className="h-16 w-56 object-contain"
              src={logo}
            />
          </div>

          {/* <div className="space-y-3 text-center">
            <h1 className="text-2xl font-bold text-zinc-950">
              Sign in to Who Changed the Response
            </h1>
            <p className="text-sm leading-6 text-zinc-600">
              Use email and password, or continue with Google.
            </p>
          </div>

          <EmailPasswordAuthForm onMessage={setAuthMessage} />

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              or
            </span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          {authMessage ? (
            <p
              className={`rounded-md border px-3 py-2 text-sm ${
                authMessage.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {authMessage.text}
            </p>
          ) : null} */}

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
