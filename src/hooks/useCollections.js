import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useCollections(userId) {
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [collectionsError, setCollectionsError] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadCollections() {
      if (!supabase || !userId) {
        await Promise.resolve();

        if (!ignore) {
          setCollections([]);
          setCollectionsLoading(false);
        }

        return;
      }

      const { data, error } = await supabase
        .from("collections")
        .select("id,name,is_public,public_token,created_at,updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (ignore) return;

      setCollectionsLoading(false);

      if (error) {
        setCollectionsError(error.message);
        return;
      }

      setCollections(data ?? []);
    }

    loadCollections();

    return () => {
      ignore = true;
    };
  }, [userId]);

  async function createCollection(name) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setCollectionsError("Collection name is required.");
      return null;
    }

    if (!supabase || !userId) {
      setCollectionsError("Supabase is not configured.");
      return null;
    }

    setCreatingCollection(true);
    setCollectionsError("");

    const { data, error } = await supabase
      .from("collections")
      .insert({ name: trimmedName, user_id: userId })
      .select("id,name,is_public,public_token,created_at,updated_at")
      .single();

    setCreatingCollection(false);

    if (error) {
      setCollectionsError(error.message);
      return null;
    }

    setCollections((currentCollections) => [data, ...currentCollections]);
    return data;
  }

  async function renameCollection(id, newName) {
    const trimmedName = newName.trim();
    if (!trimmedName || !supabase || !userId) return false;

    const { error } = await supabase
      .from("collections")
      .update({ name: trimmedName })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setCollectionsError(error.message);
      return false;
    }

    setCollections((current) =>
      current.map((c) => (c.id === id ? { ...c, name: trimmedName } : c)),
    );
    return true;
  }

  async function deleteCollection(id) {
    if (!supabase || !userId) return false;

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setCollectionsError(error.message);
      return false;
    }

    setCollections((current) => current.filter((c) => c.id !== id));
    return true;
  }

  return {
    collections,
    collectionsError,
    collectionsLoading,
    createCollection,
    creatingCollection,
    deleteCollection,
    renameCollection,
  };
}
