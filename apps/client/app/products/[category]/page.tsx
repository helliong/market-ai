import { redirect } from "next/navigation";
import { getCatalogProduct } from "@/lib/catalog-products";
import { getProductPath } from "@/lib/product-url";

type ProductRouteProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function ProductRedirect({
  params,
}: ProductRouteProps) {
  const { category: idOrCategory } = await params;
  
  // Backwards compatibility for /products/[id]
  const id = Number(idOrCategory);
  if (!Number.isNaN(id) && id > 0) {
    const product = await getCatalogProduct(id);
    if (product) {
      redirect(getProductPath(product));
    }
  }

  // Otherwise, redirect to catalog
  redirect("/catalog");
}
