import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";
import { ProductSection } from "@/components/home/ProductSection";
import { getCatalogFeed } from "@/lib/catalog-products";

// Главная страница собирает стартовый экран, AI-виджет и подборки товаров.
export default async function Home() {
  const feed = await getCatalogFeed();

  return (
    <main>
      <Header />
      <Hero />
      <ProductSection initialProducts={feed.items} initialNextCursor={feed.nextCursor} />
    </main>
  );
}
