import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useCollection(collectionId, userId) {
  const [collection, setCollection] = useState(null);
  const [collectionLoading, setCollectionLoading] = useState(Boolean(collectionId));
  const [collectionError, setCollectionError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCollection() {
      await Promise.resolve();

      if (ignore) return;

      setCollectionLoading(Boolean(collectionId && userId));
      setCollectionError("");

      if (!supabase || !collectionId || !userId) {
        setCollection(null);
        setCollectionLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("collections")
        .select("id,name,is_public,public_token,created_at,updated_at")
        .eq("id", collectionId)
        .eq("user_id", userId)
        .maybeSingle();

      if (ignore) return;

      setCollectionLoading(false);

      if (error) {
        setCollectionError(error.message);
        return;
      }

      setCollection(data);
    }

    loadCollection();

    return () => {
      ignore = true;
    };
  }, [collectionId, userId]);

  return { collection, collectionError, collectionLoading };
}
