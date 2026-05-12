import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useCompare(compareId, userId) {
  const [compare, setCompare] = useState(null);
  const [compareLoading, setCompareLoading] = useState(Boolean(compareId));
  const [compareError, setCompareError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCompare() {
      await Promise.resolve();

      if (ignore) return;

      setCompareLoading(Boolean(compareId && userId));
      setCompareError("");

      if (!supabase || !compareId || !userId) {
        setCompare(null);
        setCompareLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("compares")
        .select("id,name,collection_id,created_at,updated_at")
        .eq("id", compareId)
        .eq("user_id", userId)
        .maybeSingle();

      if (ignore) return;

      setCompareLoading(false);

      if (error) {
        setCompareError(error.message);
        return;
      }

      setCompare(data);
    }

    loadCompare();

    return () => {
      ignore = true;
    };
  }, [compareId, userId]);

  return { compare, compareError, compareLoading };
}
