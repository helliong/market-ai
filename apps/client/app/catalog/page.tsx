import { CatalogPage } from "@/components/catalog/CatalogPage";
import { Header } from "@/components/layout/Header";

type CatalogRouteProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function Catalog({ searchParams }: CatalogRouteProps) {
  const { category } = await searchParams;
  const categoryId = Number(category);
  const initialCategory = Number.isFinite(categoryId) ? categoryId : "all";

  return (
    <main>
      <Header />
      <CatalogPage initialCategory={initialCategory} />
    </main>
  );
}
