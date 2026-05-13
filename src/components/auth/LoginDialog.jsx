import { useState } from "react";
import { X } from "lucide-react";
import logo from "../../assets/logo.png";
import { EmailPasswordAuthForm } from "./EmailPasswordAuthForm";
import { GoogleAuthButton } from "../common/GoogleAuthButton";
import { signInWithGoogle } from "../../lib/auth";
import { hasSupabaseConfig } from "../../supabaseClient";

export function LoginDialog({ onClose }) {
  const [authMessage, setAuthMessage] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

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
            alt="Who Changed the Response"
            className="h-12 w-44 object-contain"
            src={logo}
          />
        </div>
         <div className="space-y-3 text-center">
            <h1 className="text-2xl font-bold text-zinc-950">
              Sign in to Who Changed the Response
            </h1>
            <p className="text-sm leading-6 text-zinc-600">
              Use continue with Google.
            </p>
          </div>
        {/* <EmailPasswordAuthForm onMessage={setAuthMessage} onSuccess={onClose} /> */}

        {/* <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            or
          </span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div> */}

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
