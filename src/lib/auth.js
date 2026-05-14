import { hasSupabaseConfig, supabase } from "../supabaseClient";

export function getAuthRedirectUrl() {
  const base = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${base}/login`;
}

export async function signInWithGoogle() {
  if (!hasSupabaseConfig || !supabase) {
    return {
      error: new Error("Supabase is not configured. Check your Vite env values."),
    };
  }

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthRedirectUrl(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
}

export async function signInWithEmailPassword({ email, password }) {
  if (!hasSupabaseConfig || !supabase) {
    return {
      error: new Error("Supabase is not configured. Check your Vite env values."),
    };
  }

  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUpWithEmailPassword({ email, password }) {
  if (!hasSupabaseConfig || !supabase) {
    return {
      error: new Error("Supabase is not configured. Check your Vite env values."),
    };
  }

  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });
}
