import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";
import { ProductSection } from "@/components/home/ProductSection";
import { AIWidget } from "@/components/home/AIWidget";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <ProductSection />
      <AIWidget />
    </main>
  );
}
