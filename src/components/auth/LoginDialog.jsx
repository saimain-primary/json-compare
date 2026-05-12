import { useState } from "react";
import { X } from "lucide-react";
import logo from "../../assets/logo.png";
import { GoogleAuthButton } from "../common/GoogleAuthButton";
import { signInWithGoogle } from "../../lib/auth";
import { hasSupabaseConfig } from "../../supabaseClient";

export function LoginDialog({ onClose }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <button
          aria-label="Close sign-in dialog"
          className="absolute right-4 top-4 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>

        <div className="flex justify-center">
          <img
            alt="Blame the API"
            className="h-12 w-44 object-contain"
            src={logo}
          />
        </div>

        <div className="mt-6 space-y-2 text-center">
          <h2 className="text-xl font-bold text-zinc-950">
            Sign in to Blame the API
          </h2>
          <p className="text-sm leading-6 text-zinc-500">
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
    </div>
  );
}
