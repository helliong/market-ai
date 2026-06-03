// Превращает название магазина в стабильный URL-slug.
export function getStoreSlug(storeName: string) {
  return encodeURIComponent(
    storeName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-"),
  );
}

// Возвращает человекочитаемое название магазина из slug, если прямого совпадения нет.
export function getStoreNameFromSlug(slug: string) {
  return decodeURIComponent(slug).replace(/-/g, " ");
}
