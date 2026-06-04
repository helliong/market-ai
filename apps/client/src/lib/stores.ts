import { getCatalogProducts } from "@/lib/catalog-products";
import { getStoreSlug } from "@/lib/store-slug";

export async function getAvailableStoreNames() {
  const products = await getCatalogProducts();

  return Array.from(
    new Set(
      products
        .map((product) => product.storeName)
        .filter((storeName): storeName is string => Boolean(storeName)),
    ),
  );
}

export async function findStoreNameBySlug(slug: string) {
  const storeNames = await getAvailableStoreNames();

  return storeNames.find((storeName) => getStoreSlug(storeName) === slug);
}
