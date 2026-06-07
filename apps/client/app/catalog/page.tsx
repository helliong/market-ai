import { CatalogPage } from "@/components/catalog/CatalogPage";
import { Header } from "@/components/layout/Header";
import { getCatalogProducts } from "@/lib/catalog-products";

type CatalogRouteProps = {
  searchParams: Promise<{
    category?: string;
    q?: string;
    subcategory?: string;
  }>;
};

// Маршрут каталога читает query-параметры и передает начальные фильтры в экран каталога.
export default async function Catalog({ searchParams }: CatalogRouteProps) {
  const { category, q, subcategory } = await searchParams;
  const categoryId = Number(category);
  const initialCategory = Number.isFinite(categoryId) ? categoryId : "all";
  const initialQuery = q ?? "";
  const initialSubcategory = subcategory ?? "";
  const products = await getCatalogProducts();

  return (
    <main>
      <Header />
      <CatalogPage 
        initialCategory={initialCategory} 
        initialQuery={initialQuery} 
        initialSubcategory={initialSubcategory}
        initialProducts={products}
      />
    </main>
  );
}
