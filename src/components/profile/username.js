export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export function normalizeUsername(value) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value) {
  return USERNAME_PATTERN.test(value);
}
