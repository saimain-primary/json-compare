export function getUserDisplayName(user) {
  return (
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.username ||
    user.email
  );
}

export function getUserAvatarUrl(user) {
  return user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
}

export function getUserInitials(name) {
  const words = name
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}
