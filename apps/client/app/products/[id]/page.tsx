import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ProductPage } from "@/components/product/ProductPage";
import { products } from "@/data/products";

type ProductRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Product({ params }: ProductRouteProps) {
  const { id } = await params;
  const product = products.find((item) => item.id === Number(id));

  if (!product) {
    notFound();
  }

  return (
    <main>
      <Header />
      <ProductPage product={product} />
    </main>
  );
}
