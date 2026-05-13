export function publicCollectionUrl(token) {
  return `${window.location.origin}/shared/collections/${token}`;
}

export function publicCollectionCompareUrl(collectionToken, compareId) {
  return `${publicCollectionUrl(collectionToken)}/compares/${compareId}`;
}

export function publicCompareUrl(token) {
  return `${window.location.origin}/shared/${token}`;
}

export async function copyOrShareUrl({ title, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      // Sharing can be cancelled by the user.
    }
  }

  await navigator.clipboard.writeText(url);
}
