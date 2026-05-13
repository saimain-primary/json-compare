import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function usePublicSharedCollection(token) {
  const [collection, setCollection] = useState(null);
  const [compares, setCompares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadSharedCollection() {
      if (!supabase || !token) {
        await Promise.resolve();

        if (!ignore) {
          setLoading(false);
          setError("Shared collection link is not available.");
        }

        return;
      }

      const { data: collectionData, error: collectionError } = await supabase
        .from("collections")
        .select("id,name,public_token,created_at")
        .eq("public_token", token)
        .eq("is_public", true)
        .maybeSingle();

      if (ignore) return;

      if (collectionError || !collectionData) {
        setLoading(false);
        setError(collectionError?.message || "Shared collection not found.");
        return;
      }

      const { data: compareData, error: compareError } = await supabase
        .from("compares")
        .select("id,name,collection_id,created_at,updated_at")
        .eq("collection_id", collectionData.id)
        .order("created_at", { ascending: false });

      if (ignore) return;

      setLoading(false);

      if (compareError) {
        setError(compareError.message);
        return;
      }

      setCollection(collectionData);
      setCompares(compareData ?? []);
    }

    loadSharedCollection();

    return () => {
      ignore = true;
    };
  }, [token]);

  return { collection, compares, error, loading };
}
