import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useSupabaseSession() {
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase));
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setAuthLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setAuthLoading(false);
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { authLoading, session };
}
