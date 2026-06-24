"use client";

import { useEffect, useRef } from "react";
import { AdPlaceholderCard } from "@/components/ui/AdPlaceholderCard";
import { ProductCard } from "@/components/ui/ProductCard";
import { useCatalogFeed } from "@/hooks/useCatalogProducts";
import { Loader2 } from "lucide-react";
import type { ClientProduct } from "@/lib/catalog-products";

type Product = ClientProduct;

type ProductGridSlot =
  | {
      type: "product";
      product: Product;
    }
  | {
      type: "ad";
      placement: number;
    };

type ProductSectionProps = {
  initialProducts?: Product[];
  initialNextCursor?: number | null;
};

// Блок главной страницы с популярными товарами и рекламными слотами.
export function ProductSection({ initialProducts = [], initialNextCursor = null }: ProductSectionProps) {
  const { products, loadMore, hasMore, isLoadingMore } = useCatalogFeed(initialProducts, initialNextCursor);

  return (
    <section className="mx-auto mt-12 max-w-[1440px] px-4 pb-16 md:px-8">

      <ResponsiveProductGrid products={products} columns={2} className="grid grid-cols-2 gap-3 sm:gap-4 lg:hidden" />
      <ResponsiveProductGrid products={products} columns={3} className="hidden gap-4 lg:grid lg:grid-cols-3 xl:hidden" />
      <ResponsiveProductGrid products={products} columns={4} className="hidden xl:grid xl:grid-cols-4 xl:gap-5" />

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <LoadMoreTrigger onIntersect={loadMore} isLoading={isLoadingMore} />
        </div>
      )}
    </section>
  );
}

function LoadMoreTrigger({ onIntersect, isLoading }: { onIntersect: () => void; isLoading: boolean }) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onIntersect();
      }
    });

    const currentTarget = triggerRef.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
      observer.disconnect();
    };
  }, [isLoading, onIntersect]);

  return (
    <div ref={triggerRef} className="h-10 w-full flex items-center justify-center">
      {isLoading && <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />}
    </div>
  );
}

// Рендерит адаптивную сетку товаров с учетом количества колонок на экране.
function ResponsiveProductGrid({
  products,
  columns,
  className,
}: {
  products: Product[];
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
