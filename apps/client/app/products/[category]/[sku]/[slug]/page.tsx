import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ProductUnavailableState } from "@/components/not-found/ProductUnavailableState";
import { ProductPage } from "@/components/product/ProductPage";
import { getCatalogProductBySku, getCatalogProducts } from "@/lib/catalog-products";
import { getProductPath } from "@/lib/product-url";

type ProductSeoRouteProps = {
  params: Promise<{
    category: string;
    sku: string;
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductSeoRouteProps): Promise<Metadata> {
  const { sku } = await params;
  const product = await getCatalogProductBySku(sku);

  if (!product) {
    return {
      title: "Товар не найден",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const productPath = getProductPath(product);
  const descriptionParts = [
    product.description || `${product.title} в каталоге MarketAI.`,
    `Цена: ${product.price}.`,
    product.storeName ? `Продавец: ${product.storeName}.` : undefined,
  ].filter(Boolean);

  return {
    title: `${product.title} купить`,
    description: descriptionParts.join(" "),
    alternates: {
      canonical: productPath,
    },
    openGraph: {
      title: `${product.title} купить`,
      description: descriptionParts.join(" "),
      type: "website",
      url: productPath,
    },
  };
}

export default async function ProductSeoPage({
  params,
}: ProductSeoRouteProps) {
  const { category, sku, slug } = await params;
  const product = await getCatalogProductBySku(sku);

  if (!product) {
    return (
      <main>
        <Header />
        <ProductUnavailableState />
      </main>
    );
  }

  const productPath = getProductPath(product);
  const currentPath = `/products/${category}/${sku}/${slug}`;
  if (currentPath !== productPath) {
    redirect(productPath);
  }

  const relatedProducts = await getCatalogProducts();

  return (
    <main>
      <Header />
      <ProductPage product={product} relatedProducts={relatedProducts} />
    </main>
  );
}
