import { hasSupabaseConfig, supabase } from "../supabaseClient";

export function getAuthRedirectUrl() {
  return window.location.origin;
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
