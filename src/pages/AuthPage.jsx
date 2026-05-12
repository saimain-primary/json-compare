import { useState } from "react";
import logo from "../assets/logo.png";
import { GoogleAuthButton } from "../components/common/GoogleAuthButton";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { signInWithGoogle } from "../lib/auth";
import { hasSupabaseConfig, supabase } from "../supabaseClient";

export function AuthPage({ onToggleTheme, theme }) {
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isRegisterMode = authMode === "register";
  const isForgotMode = authMode === "forgot";

  async function handleGoogleLogin() {
    setAuthMessage("");
    setGoogleLoading(true);

    const { error } = await signInWithGoogle();

    if (error) {
      setAuthMessage(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthMessage("");

    if (!hasSupabaseConfig || !supabase) {
      setAuthMessage("Supabase is not configured. Check your Vite env values.");
      return;
    }

    setAuthLoading(true);

    if (isForgotMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      setAuthLoading(false);

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      setAuthMessage("Password reset link sent. Check your email.");
      return;
    }

    const authResponse = isRegisterMode
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setAuthLoading(false);

    if (authResponse.error) {
      setAuthMessage(authResponse.error.message);
      return;
    }

    if (isRegisterMode && !authResponse.data.session) {
      setAuthMessage("Registration created. Check your email to confirm login.");
      return;
    }

    setAuthMessage("");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-8 text-zinc-950">
      <section className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/60 sm:p-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle onToggle={onToggleTheme} theme={theme} />
        </div>

        <form onSubmit={handleAuthSubmit}>
          <div className="mb-8 flex justify-center pt-6">
            <img
              alt="JSON Compare logo"
              className="h-16 w-56 object-contain"
              src={logo}
            />
          </div>

          <div className="mb-6 flex rounded-lg bg-zinc-100 p-1">
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                !isRegisterMode
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
              onClick={() => {
                setAuthMode("login");
                setAuthMessage("");
              }}
              type="button"
            >
              Login
            </button>
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                isRegisterMode
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
              onClick={() => {
                setAuthMode("register");
                setAuthMessage("");
              }}
              type="button"
            >
              Register
            </button>
          </div>

          <label className="mt-6 block text-sm font-semibold text-zinc-800">
            Email
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          {!isForgotMode ? (
            <label className="mt-4 block text-sm font-semibold text-zinc-800">
              Password
              <input
                autoComplete={
                  isRegisterMode ? "new-password" : "current-password"
                }
                className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                required
                type="password"
                value={password}
              />
            </label>
          ) : null}

          {!isRegisterMode ? (
            <button
              className="mt-3 text-sm font-semibold text-teal-700 transition hover:text-teal-900"
              onClick={() => {
                setAuthMode(isForgotMode ? "login" : "forgot");
                setAuthMessage("");
              }}
              type="button"
            >
              {isForgotMode ? "Back to login" : "Forgot password?"}
            </button>
          ) : null}

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

          <button
            className="mt-6 w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={authLoading || !hasSupabaseConfig}
            type="submit"
          >
            {authLoading
              ? "Please wait..."
              : isForgotMode
                ? "Send reset link"
                : isRegisterMode
                  ? "Register"
                  : "Login"}
          </button>
          {!isForgotMode ? (
            <GoogleAuthButton
              disabled={!hasSupabaseConfig}
              loading={googleLoading}
              onClick={handleGoogleLogin}
            />
          ) : null}
        </form>
      </section>
    </main>
  );
}
