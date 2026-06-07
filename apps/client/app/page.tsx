import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";
import { ProductSection } from "@/components/home/ProductSection";
import { getCatalogProducts } from "@/lib/catalog-products";

// Главная страница собирает стартовый экран, AI-виджет и подборки товаров.
export default async function Home() {
  const products = await getCatalogProducts();

  return (
    <main>
      <Header />
      <Hero />
      <ProductSection initialProducts={products} />
    </main>
  );
}
