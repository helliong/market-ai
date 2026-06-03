import { CatalogPage } from "@/components/catalog/CatalogPage";
import { Header } from "@/components/layout/Header";

type CatalogRouteProps = {
  searchParams: Promise<{
    category?: string;
    q?: string;
  }>;
};

// Маршрут каталога читает query-параметры и передает начальные фильтры в экран каталога.
export default async function Catalog({ searchParams }: CatalogRouteProps) {
  const { category, q } = await searchParams;
  const categoryId = Number(category);
  const initialCategory = Number.isFinite(categoryId) ? categoryId : "all";
  const initialQuery = q ?? "";

  return (
    <main>
      <Header />
      <CatalogPage initialCategory={initialCategory} initialQuery={initialQuery} />
    </main>
  );
}
