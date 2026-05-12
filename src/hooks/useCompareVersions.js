import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const bucketName = "json-version-files";

function jsonFile(value) {
  return new Blob([value], { type: "application/json" });
}

export function useCompareVersions({ collectionId, compareId, userId }) {
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState("");
  const [savingVersion, setSavingVersion] = useState(false);
  const [loadingVersionFiles, setLoadingVersionFiles] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadVersions() {
      await Promise.resolve();

      if (ignore) return;

      setVersionsLoading(Boolean(compareId && userId));
      setVersionsError("");

      if (!supabase || !compareId || !userId) {
        setVersions([]);
        setVersionsLoading(false);

        return;
      }

      const { data, error } = await supabase
        .from("compare_versions")
        .select(
          "id,name,compare_id,source_path,target_path,source_size,target_size,diff_count,compare_options,created_at",
        )
        .eq("compare_id", compareId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (ignore) return;

      setVersionsLoading(false);

      if (error) {
        setVersionsError(error.message);
        return;
      }

      setVersions(data ?? []);
    }

    loadVersions();

    return () => {
      ignore = true;
    };
  }, [compareId, userId]);

  async function createVersion({
    compareOptions,
    diffCount,
    name,
    sourceJson,
    targetJson,
  }) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setVersionsError("Version name is required.");
      return null;
    }

    if (!supabase || !collectionId || !compareId || !userId) {
      setVersionsError("Supabase is not configured.");
      return null;
    }

    const versionId = crypto.randomUUID();
    const basePath = `${userId}/${collectionId}/${compareId}/${versionId}`;
    const sourcePath = `${basePath}/source.json`;
    const targetPath = `${basePath}/target.json`;
    const sourceFile = jsonFile(sourceJson);
    const targetFile = jsonFile(targetJson);

    setSavingVersion(true);
    setVersionsError("");

    const sourceUpload = await supabase.storage
      .from(bucketName)
      .upload(sourcePath, sourceFile, {
        contentType: "application/json",
        upsert: true,
      });

    if (sourceUpload.error) {
      setSavingVersion(false);
      setVersionsError(sourceUpload.error.message);
      return null;
    }

    const targetUpload = await supabase.storage
      .from(bucketName)
      .upload(targetPath, targetFile, {
        contentType: "application/json",
        upsert: true,
      });

    if (targetUpload.error) {
      setSavingVersion(false);
      setVersionsError(targetUpload.error.message);
      return null;
    }

    const { data, error } = await supabase
      .from("compare_versions")
      .insert({
        id: versionId,
        compare_id: compareId,
        compare_options: compareOptions,
        diff_count: diffCount,
        name: trimmedName,
        source_path: sourcePath,
        source_size: sourceFile.size,
        target_path: targetPath,
        target_size: targetFile.size,
        user_id: userId,
      })
      .select(
        "id,name,compare_id,source_path,target_path,source_size,target_size,diff_count,compare_options,created_at",
      )
      .single();

    setSavingVersion(false);

    if (error) {
      setVersionsError(error.message);
      return null;
    }

    setVersions((currentVersions) => [data, ...currentVersions]);
    return data;
  }

  async function loadVersionFiles(version) {
    if (!supabase) {
      setVersionsError("Supabase is not configured.");
      return null;
    }

    setLoadingVersionFiles(true);
    setVersionsError("");

    const [sourceDownload, targetDownload] = await Promise.all([
      supabase.storage.from(bucketName).download(version.source_path),
      supabase.storage.from(bucketName).download(version.target_path),
    ]);

    setLoadingVersionFiles(false);

    if (sourceDownload.error) {
      setVersionsError(sourceDownload.error.message);
      return null;
    }

    if (targetDownload.error) {
      setVersionsError(targetDownload.error.message);
      return null;
    }

    return {
      sourceJson: await sourceDownload.data.text(),
      targetJson: await targetDownload.data.text(),
    };
  }

  return {
    createVersion,
    loadingVersionFiles,
    savingVersion,
    loadVersionFiles,
    versions,
    versionsError,
    versionsLoading,
  };
}
