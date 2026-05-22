"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { ProductCard } from "@/components/ui/ProductCard";

export function CatalogPage({
  initialCategory = "all",
}: {
  initialCategory?: number | "all";
}) {
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    initialCategory,
  );

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      return (
        selectedCategory === "all" ||
        product.categoryIds.includes(selectedCategory)
      );
    });
  }, [selectedCategory]);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6 lg:mb-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#6D4AFF]">
            MarketAI catalog
          </p>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">
            Каталог товаров
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Выберите категорию, чтобы перейти к товарам нужного раздела.
          </p>
        </div>

        <div className="hidden w-fit rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#6D4AFF] shadow-[0_8px_24px_rgba(15,23,42,0.06)] lg:block">
          Найдено: {filteredProducts.length}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-black">Категории</h2>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:block lg:space-y-2">
            <Link
              href="/catalog"
              onClick={() => setSelectedCategory("all")}
              className={`flex h-12 w-full items-center justify-between rounded-2xl px-4 text-left text-sm font-bold transition ${
                selectedCategory === "all"
                  ? "bg-[#F1EDFF] text-[#6D4AFF]"
                  : "text-[#111827] hover:bg-[#F6F7FB]"
              }`}
            >
              Все товары
              <span>{products.length}</span>
            </Link>

            {categories.map((category) => {
              const Icon = category.icon;
              const count = products.filter((product) =>
                product.categoryIds.includes(category.id),
              ).length;

              return (
                <Link
                  key={category.id}
                  href={`/catalog?category=${category.id}`}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-bold transition ${
                    selectedCategory === category.id
                      ? "bg-[#F1EDFF] text-[#6D4AFF]"
                      : "text-[#111827] hover:bg-[#F6F7FB]"
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1">{category.title}</span>
                  <span>{count}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="hidden lg:block">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 xl:gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[32px] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <h2 className="text-2xl font-black">Ничего не найдено</h2>
              <p className="mt-3 max-w-[420px] text-[#6B7280]">
                Попробуйте выбрать другую категорию.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="mt-6 rounded-2xl bg-[#6D4AFF] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#4F32D9]"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
