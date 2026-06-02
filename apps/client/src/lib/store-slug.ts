export function getStoreSlug(storeName: string) {
  return encodeURIComponent(
    storeName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-"),
  );
}

export function getStoreNameFromSlug(slug: string) {
  return decodeURIComponent(slug).replace(/-/g, " ");
}
