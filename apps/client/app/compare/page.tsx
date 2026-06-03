import { Header } from "@/components/layout/Header";
import { ComparePage } from "@/components/compare/ComparePage";

// Страница сравнения показывает выбранные товары в сравнительной таблице.
export default function Compare() {
  return (
    <main>
      <Header />
      <ComparePage />
    </main>
  );
}
