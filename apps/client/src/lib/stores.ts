import { products } from "@/data/products";
import { getStoreSlug } from "@/lib/store-slug";

export function getAvailableStoreNames() {
  return Array.from(
    new Set(
      products
        .map((product) => product.storeName)
        .filter((storeName): storeName is string => Boolean(storeName)),
    ),
  );
}

export function findStoreNameBySlug(slug: string) {
  return getAvailableStoreNames().find(
    (storeName) => getStoreSlug(storeName) === slug,
  );
}
