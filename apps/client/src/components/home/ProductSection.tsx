"use client";
import Link from "next/link";
import { products } from "@/data/products";
import { AdPlaceholderCard } from "@/components/ui/AdPlaceholderCard";
import { ProductCard } from "@/components/ui/ProductCard";
import { useLanguage } from "@/hooks/useLanguage";

type Product = (typeof products)[number];

type ProductGridSlot =
  | {
      type: "product";
      product: Product;
    }
  | {
      type: "ad";
      placement: number;
    };

// Блок главной страницы с популярными товарами и рекламными слотами.
export function ProductSection() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto mt-12 max-w-[1440px] px-4 pb-16 md:px-8">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.03em] md:text-3xl">{t("popularProducts")}</h2>
          <p className="mt-2 text-[#6B7280]">{t("popularSubtext")}</p>
        </div>
        <Link href="/catalog" className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#6D4AFF] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">{t("viewAll")}</Link>
      </div>
      <ResponsiveProductGrid columns={2} className="grid grid-cols-2 gap-3 sm:gap-4 lg:hidden" />
      <ResponsiveProductGrid columns={3} className="hidden gap-4 lg:grid lg:grid-cols-3 xl:hidden" />
      <ResponsiveProductGrid columns={4} className="hidden xl:grid xl:grid-cols-4 xl:gap-5" />
    </section>
  );
}

// Рендерит адаптивную сетку товаров с учетом количества колонок на экране.
function ResponsiveProductGrid({
  columns,
  className,
}: {
  columns: number;
  className: string;
}) {
  return (
    <div className={className}>
      {buildProductGridSlots(products, columns).map((slot) => {
        if (slot.type === "ad") {
          return (
            <AdPlaceholderCard
              key={`ad-${columns}-${slot.placement}`}
              placement={slot.placement}
            />
          );
        }

        return <ProductCard key={`product-${columns}-${slot.product.id}`} {...slot.product} />;
      })}
    </div>
  );
}

// Раскладывает товары и рекламные вставки по слотам сетки без ручной верстки каждого ряда.
function buildProductGridSlots(productList: Product[], columns: number) {
  const slots: ProductGridSlot[] = [];
  let productIndex = 0;
  let adPlacement = 0;
  let rowIndex = 0;

  while (productIndex < productList.length) {
    const isAdRow = rowIndex >= 2 && (rowIndex - 2) % 3 === 0;
    const adColumn = isAdRow ? getAdColumn(adPlacement + 1, columns) : -1;

    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      if (isAdRow && columnIndex === adColumn) {
        adPlacement += 1;
        slots.push({ type: "ad", placement: adPlacement });
        continue;
      }

      if (productIndex >= productList.length) {
        break;
      }

      slots.push({ type: "product", product: productList[productIndex] });
      productIndex += 1;
    }

    rowIndex += 1;
  }

  return slots;
}

// Выбирает колонку для рекламного слота так, чтобы реклама распределялась по сетке.
function getAdColumn(placement: number, columns: number) {
  return (placement + Math.floor(columns / 2) - 1) % columns;
}
