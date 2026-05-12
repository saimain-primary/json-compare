import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useCompares(collectionId, userId) {
  const [compares, setCompares] = useState([]);
  const [comparesLoading, setComparesLoading] = useState(false);
  const [comparesError, setComparesError] = useState("");
  const [creatingCompare, setCreatingCompare] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadCompares() {
      await Promise.resolve();

      if (ignore) return;

      setComparesLoading(Boolean(collectionId && userId));
      setComparesError("");

      if (!supabase || !collectionId || !userId) {
        setCompares([]);
        setComparesLoading(false);

        return;
      }

      const { data, error } = await supabase
        .from("compares")
        .select("id,name,collection_id,created_at,updated_at")
        .eq("collection_id", collectionId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (ignore) return;

      setComparesLoading(false);

      if (error) {
        setComparesError(error.message);
        return;
      }

      setCompares(data ?? []);
    }

    loadCompares();

    return () => {
      ignore = true;
    };
  }, [collectionId, userId]);

  async function createCompare(name) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setComparesError("Compare name is required.");
      return null;
    }

    if (!supabase || !collectionId || !userId) {
      setComparesError("Supabase is not configured.");
      return null;
    }

    setCreatingCompare(true);
    setComparesError("");

    const { data, error } = await supabase
      .from("compares")
      .insert({ collection_id: collectionId, name: trimmedName, user_id: userId })
      .select("id,name,collection_id,created_at,updated_at")
      .single();

    setCreatingCompare(false);

    if (error) {
      setComparesError(error.message);
      return null;
    }

    setCompares((currentCompares) => [data, ...currentCompares]);
    return data;
  }

  return {
    compares,
    comparesError,
    comparesLoading,
    createCompare,
    creatingCompare,
  };
}
