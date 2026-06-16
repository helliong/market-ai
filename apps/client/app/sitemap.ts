import type { MetadataRoute } from "next";
import { categories } from "@/data/categories";
import { getCatalogProducts } from "@/lib/catalog-products";
import { catalogSectionsByCategory } from "@/lib/catalog-data";
import { getCatalogSlug } from "@/lib/catalog-slug";
import { getProductPath } from "@/lib/product-url";
import { absoluteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCatalogProducts();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/catalog"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const catalogRoutes = Array.from(
    new Set([
      ...categories.map((category) => `/catalog?category=${category.id}`),
      ...Object.values(catalogSectionsByCategory).flatMap((sections) =>
        sections.flatMap((section) =>
          section.items.map((item) => `/catalog/${getCatalogSlug(item)}`),
        ),
      ),
    ]),
  ).map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const productRoutes = products.map((product) => ({
    url: absoluteUrl(getProductPath(product)),
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...catalogRoutes, ...productRoutes];
}
