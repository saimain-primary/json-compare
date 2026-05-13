import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { IconButton } from "../common/IconButton";
import { supabase } from "../../supabaseClient";
import { isValidUsername, normalizeUsername } from "./username";

export function ProfileDialog({ onClose, session }) {
  const metadata = session.user.user_metadata ?? {};
  const initialDisplayName =
    metadata.display_name ?? metadata.full_name ?? metadata.name ?? "";
  const [username, setUsername] = useState(metadata.username ?? "");
  const [displayName, setDisplayName] = useState(
    initialDisplayName,
  );
  const [newPassword, setNewPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!supabase) {
        setProfileReady(true);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (ignore) {
        return;
      }

      if (error) {
        setProfileMessage(
          error.code === "42P01"
            ? "Apply the profiles migration in Supabase to enable usernames."
            : error.message,
        );
        setProfileReady(true);
        return;
      }

      if (data) {
        setUsername(data.username ?? metadata.username ?? "");
        setDisplayName(data.display_name ?? initialDisplayName);
      }

      setProfileReady(true);
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [initialDisplayName, metadata.username, session.user.id]);

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileMessage("");

    if (!supabase) {
      setProfileMessage("Supabase is not configured.");
      return;
    }

    const normalizedUsername = normalizeUsername(username);
    const trimmedDisplayName = displayName.trim();

    if (!isValidUsername(normalizedUsername)) {
      setProfileMessage(
        "Username must be 3-30 characters using lowercase letters, numbers, or underscores.",
      );
      return;
    }

    setProfileLoading(true);
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        display_name: trimmedDisplayName,
        user_id: session.user.id,
        username: normalizedUsername,
      },
      { onConflict: "user_id" },
    );

    if (profileError) {
      setProfileLoading(false);
      setProfileMessage(
        profileError.code === "23505"
          ? "That username is already taken."
          : profileError.code === "42P01"
            ? "Apply the profiles migration in Supabase to enable usernames."
            : profileError.message,
      );
      return;
    }

    const updates = {
      data: {
        display_name: trimmedDisplayName,
        username: normalizedUsername,
      },
    };

    if (newPassword) {
      updates.password = newPassword;
    }

    const { error } = await supabase.auth.updateUser(updates);
    setProfileLoading(false);

    if (error) {
      setProfileMessage(error.message);
      return;
    }

    setNewPassword("");
    setUsername(normalizedUsername);
    setProfileMessage("Profile updated.");
  }

  return (
    <div
      aria-labelledby="profile-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-2 py-3 sm:px-4 sm:py-6"
      role="dialog"
    >
      <form
        className="max-h-[94vh] w-full max-w-lg overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 shadow-2xl"
        onSubmit={handleProfileSubmit}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div>
            <h2
              className="text-lg font-semibold text-zinc-950"
              id="profile-dialog-title"
            >
              Manage profile
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{session.user.email}</p>
          </div>
          <IconButton label="Close profile dialog" onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </IconButton>
        </div>

        <div className="space-y-4 px-5 py-5">
          <label className="block text-sm font-semibold text-zinc-800">
            Username
            <input
              autoComplete="username"
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
              disabled={!profileReady}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="your_username"
              type="text"
              value={username}
            />
            <span className="mt-1 block text-xs font-normal text-zinc-500">
              Unique, lowercase, 3-30 characters. Letters, numbers, and
              underscores only.
            </span>
          </label>

          <label className="block text-sm font-semibold text-zinc-800">
            Display name
            <input
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
              type="text"
              value={displayName}
            />
          </label>

          <label className="block text-sm font-semibold text-zinc-800">
            New password
            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
              minLength={6}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Leave blank to keep current password"
              type="password"
              value={newPassword}
            />
          </label>

          {profileMessage ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {profileMessage}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end border-t border-zinc-200 px-5 py-4">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={profileLoading || !profileReady}
            type="submit"
          >
            <Save aria-hidden="true" size={16} />
            {profileLoading ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
