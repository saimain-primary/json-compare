import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const bucketName = "json-version-files";

export function usePublicSharedCompare(token) {
  const shareConfig =
    typeof token === "object"
      ? token
      : { compareToken: token, collectionToken: "", compareId: "" };
  const { collectionToken, compareId, compareToken } = shareConfig;
  const [compare, setCompare] = useState(null);
  const [collection, setCollection] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingVersionFiles, setLoadingVersionFiles] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadSharedCompare() {
      if (!supabase || (!compareToken && (!collectionToken || !compareId))) {
        await Promise.resolve();

        if (!ignore) {
          setLoading(false);
          setError("Shared compare link is not available.");
        }

        return;
      }

      let compareData;
      let compareError;
      let collectionData = null;

      if (collectionToken && compareId) {
        const { data: sharedCollection, error: collectionError } = await supabase
          .from("collections")
          .select("id,name,public_token")
          .eq("public_token", collectionToken)
          .eq("is_public", true)
          .maybeSingle();

        if (collectionError || !sharedCollection) {
          if (!ignore) {
            setLoading(false);
            setError(collectionError?.message || "Shared collection not found.");
          }
          return;
        }

        collectionData = sharedCollection;
        const response = await supabase
          .from("compares")
          .select("id,name,collection_id,public_token,created_at")
          .eq("id", compareId)
          .eq("collection_id", sharedCollection.id)
          .maybeSingle();
        compareData = response.data;
        compareError = response.error;
      } else {
        const response = await supabase
          .from("compares")
          .select("id,name,collection_id,public_token,created_at")
          .eq("public_token", compareToken)
          .eq("is_public", true)
          .maybeSingle();
        compareData = response.data;
        compareError = response.error;
      }

      if (ignore) return;

      if (compareError || !compareData) {
        setLoading(false);
        setError(compareError?.message || "Shared compare not found.");
        return;
      }

      const collectionRequest = collectionData
        ? Promise.resolve({ data: collectionData, error: null })
        : supabase
            .from("collections")
            .select("id,name")
            .eq("id", compareData.collection_id)
            .maybeSingle();

      const [collectionResponse, versionsResponse] = await Promise.all([
        collectionRequest,
        supabase
          .from("compare_versions")
          .select(
            "id,name,compare_id,source_path,target_path,source_size,target_size,diff_count,compare_options,created_at",
          )
          .eq("compare_id", compareData.id)
          .order("created_at", { ascending: false }),
      ]);

      if (ignore) return;

      setLoading(false);

      if (collectionResponse.error) {
        setError(collectionResponse.error.message);
        return;
      }

      if (versionsResponse.error) {
        setError(versionsResponse.error.message);
        return;
      }

      setCompare(compareData);
      setCollection(collectionResponse.data);
      setVersions(versionsResponse.data ?? []);
    }

    loadSharedCompare();

    return () => {
      ignore = true;
    };
  }, [collectionToken, compareId, compareToken]);

  async function loadVersionFiles(version) {
    if (!supabase) {
      setError("Supabase is not configured.");
      return null;
    }

    setLoadingVersionFiles(true);
    setError("");

    const [sourceDownload, targetDownload] = await Promise.all([
      supabase.storage.from(bucketName).download(version.source_path),
      supabase.storage.from(bucketName).download(version.target_path),
    ]);

    setLoadingVersionFiles(false);

    if (sourceDownload.error) {
      setError(sourceDownload.error.message);
      return null;
    }

    if (targetDownload.error) {
      setError(targetDownload.error.message);
      return null;
    }

    return {
      sourceJson: await sourceDownload.data.text(),
      targetJson: await targetDownload.data.text(),
    };
  }

  return {
    collection,
    compare,
    error,
    loading,
    loadingVersionFiles,
    loadVersionFiles,
    versions,
  };
}
