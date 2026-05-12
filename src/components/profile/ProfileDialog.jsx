import { useState } from "react";
import { supabase } from "../../supabaseClient";

export function ProfileDialog({ onClose, session }) {
  const [displayName, setDisplayName] = useState(
    session.user.user_metadata?.display_name ?? "",
  );
  const [newPassword, setNewPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileMessage("");

    if (!supabase) {
      setProfileMessage("Supabase is not configured.");
      return;
    }

    const updates = {
      data: { display_name: displayName.trim() },
    };

    if (newPassword) {
      updates.password = newPassword;
    }

    setProfileLoading(true);
    const { error } = await supabase.auth.updateUser(updates);
    setProfileLoading(false);

    if (error) {
      setProfileMessage(error.message);
      return;
    }

    setNewPassword("");
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
          <button
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <label className="block text-sm font-semibold text-zinc-800">
            Display name
            <input
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
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
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
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
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={profileLoading}
            type="submit"
          >
            {profileLoading ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
