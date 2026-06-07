import type { ClientProduct } from "@/lib/catalog-products";
import { transliterateSlug } from "@/lib/transliterate";

export function getProductCategorySlug(product: Pick<ClientProduct, "category">) {
  return transliterateSlug(product.category ?? "catalog") || "catalog";
}

export function getProductTitleSlug(product: Pick<ClientProduct, "title">) {
  return transliterateSlug(product.title) || "product";
}

export function getProductPath(
  product: Pick<ClientProduct, "category" | "sku" | "title">,
) {
  return `/products/${getProductCategorySlug(product)}/${product.sku}/${getProductTitleSlug(product)}`;
}
