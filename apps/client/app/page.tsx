import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductSection } from "@/components/home/ProductSection";
import { AIWidget } from "@/components/home/AIWidget";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <CategoryGrid />
      <ProductSection />
      <AIWidget />
    </main>
  );
}