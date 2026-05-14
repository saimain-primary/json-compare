import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import {
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "../../lib/auth";
import { hasSupabaseConfig } from "../../supabaseClient";

export function EmailPasswordAuthForm({ onMessage, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  function clearMessage() {
    onMessage(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessage();

    if (!email.trim() || !password) {
      onMessage({ tone: "error", text: "Email and password are required." });
      return;
    }

    if (isRegister && password.length < 8) {
      onMessage({ tone: "error", text: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);

    try {
      const { error } = isRegister
        ? await signUpWithEmailPassword({
            email: email.trim(),
            password,
          })
        : await signInWithEmailPassword({
            email: email.trim(),
            password,
          });

      if (error) {
        onMessage({ tone: "error", text: error.message });
        return;
      }

      if (isRegister) {
        onMessage({
          tone: "success",
          text: "Account created. Check your email if confirmation is enabled.",
        });
      } else {
        onSuccess?.();
      }
    } catch (error) {
      onMessage({
        tone: "error",
        text: error?.message || "Authentication failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleToggleMode() {
    clearMessage();
    setPassword("");
    setMode(isRegister ? "login" : "register");
  }

  if (!hasSupabaseConfig) {
    return (
      <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        Missing Supabase environment values.
      </p>
    );
  }

  return (
    <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
      <label className="block text-sm font-semibold text-zinc-800">
        Email
        <div className="mt-2 flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 transition focus-within:border-violet-600 focus-within:ring-2 focus-within:ring-violet-100">
          <Mail aria-hidden="true" className="text-zinc-400" size={16} />
          <input
            autoComplete="email"
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none"
            onChange={(event) => {
              clearMessage();
              setEmail(event.target.value);
            }}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
        </div>
      </label>

      <label className="block text-sm font-semibold text-zinc-800">
        Password
        <div className="mt-2 flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 transition focus-within:border-violet-600 focus-within:ring-2 focus-within:ring-violet-100">
          <Lock aria-hidden="true" className="text-zinc-400" size={16} />
          <input
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none"
            minLength={8}
            onChange={(event) => {
              clearMessage();
              setPassword(event.target.value);
            }}
            placeholder="Minimum 8 characters"
            type="password"
            value={password}
          />
        </div>
      </label>

      <button
        className="inline-flex w-full items-center justify-center rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        disabled={loading}
        type="submit"
      >
        {loading
          ? isRegister
            ? "Creating account..."
            : "Signing in..."
          : isRegister
            ? "Create account"
            : "Sign in"}
      </button>

      <button
        className="w-full text-center text-sm font-medium text-violet-700 transition hover:text-violet-900"
        onClick={handleToggleMode}
        type="button"
      >
        {isRegister
          ? "Already have an account? Sign in"
          : "Need an account? Create one"}
      </button>
    </form>
  );
}
