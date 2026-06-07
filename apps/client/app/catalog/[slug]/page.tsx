import { CatalogPage } from "@/components/catalog/CatalogPage";
import { Header } from "@/components/layout/Header";
import {
  getCatalogSearchQuery,
  getCatalogTitleFromSlug,
} from "@/lib/catalog-slug";
import { getCatalogProducts } from "@/lib/catalog-products";

type CatalogSubcategoryRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Маршрут подкатегории превращает slug из URL в поисковый запрос для каталога.
export default async function CatalogSubcategoryRoute({
  params,
}: CatalogSubcategoryRouteProps) {
  const { slug } = await params;
  const subcategoryTitle = getCatalogTitleFromSlug(slug);
  const products = await getCatalogProducts();

  return (
    <main>
      <Header />
      <CatalogPage
        initialCategory={1}
        initialQuery={getCatalogSearchQuery(subcategoryTitle)}
        initialSubcategory={subcategoryTitle}
        initialProducts={products}
      />
    </main>
  );
}
