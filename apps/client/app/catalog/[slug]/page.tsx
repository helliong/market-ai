import { CatalogPage } from "@/components/catalog/CatalogPage";
import { Header } from "@/components/layout/Header";
import {
  getCatalogSearchQuery,
  getCatalogTitleFromSlug,
} from "@/lib/catalog-slug";

type CatalogSubcategoryRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CatalogSubcategoryRoute({
  params,
}: CatalogSubcategoryRouteProps) {
  const { slug } = await params;
  const subcategoryTitle = getCatalogTitleFromSlug(slug);

  return (
    <main>
      <Header />
      <CatalogPage
        initialCategory={1}
        initialQuery={getCatalogSearchQuery(subcategoryTitle)}
        initialSubcategory={subcategoryTitle}
      />
    </main>
  );
}
