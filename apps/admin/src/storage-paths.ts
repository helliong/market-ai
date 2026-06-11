export function buildStoreStorageFolder(
  storeName: string,
  section: "covers" | "avatars" | "products",
  child?: string,
) {
  const parts = ["stores", toStoragePathSegment(storeName || "store"), section];
  if (child) {
    parts.push(toStoragePathSegment(child));
  }

  return parts.join("/");
}

export function isStoreStorageKey(
  key: string | null,
  section: "covers" | "avatars",
) {
  return Boolean(
    key?.startsWith(`stores/${section}/`) ||
      key?.match(new RegExp(`^stores/[^/]+/${section}/`)),
  );
}

function toStoragePathSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\p{L}\p{N}_-]+/gu, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "store"
  );
}
