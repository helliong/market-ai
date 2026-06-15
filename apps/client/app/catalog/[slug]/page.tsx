import { CatalogPage } from "@/components/catalog/CatalogPage";
import { Header } from "@/components/layout/Header";
import { getCatalogCategoryId } from "@/lib/catalog-data";
import { getCatalogTitleFromSlug } from "@/lib/catalog-slug";
import { getCatalogProducts } from "@/lib/catalog-products";

type CatalogSubcategoryRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Маршрут подкатегории отображает товары выбранной подкатегории.
export default async function CatalogSubcategoryRoute({
  params,
}: CatalogSubcategoryRouteProps) {
  const { slug } = await params;
  const subcategoryTitle = getCatalogTitleFromSlug(slug);
  const categoryId = getCatalogCategoryId(subcategoryTitle);
  const products = await getCatalogProducts();

  return (
    <main>
      <Header />
      <CatalogPage
        initialCategory={categoryId}
        initialQuery=""
        initialSubcategory={subcategoryTitle}
        initialProducts={products}
      />
    </main>
  );
}
