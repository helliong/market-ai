"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { ProductCard } from "@/components/ui/ProductCard";

type SortType = "popular" | "rating" | "price-low" | "price-high";

function getPriceValue(price: string) {
  return Number(price.replace(/\D/g, ""));
}

export function CatalogPage({
  initialCategory = "all",
}: {
  initialCategory?: number | "all";
}) {
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    initialCategory,
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortType>("popular");

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesCategory =
          selectedCategory === "all" ||
          product.categoryIds.includes(selectedCategory);
        const matchesQuery =
          !normalizedQuery ||
          product.title.toLowerCase().includes(normalizedQuery);

        return matchesCategory && matchesQuery;
      })
      .toSorted((a, b) => {
        if (sort === "rating") {
          return b.rating - a.rating;
        }

        if (sort === "price-low") {
          return getPriceValue(a.price) - getPriceValue(b.price);
        }

        if (sort === "price-high") {
          return getPriceValue(b.price) - getPriceValue(a.price);
        }

        return b.reviews - a.reviews;
      });
  }, [query, selectedCategory, sort]);

  return (
    <section className="mx-auto max-w-[1440px] px-8 py-10">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#6D4AFF]">
            MarketAI catalog
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">
            Каталог товаров
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Выбирайте категорию, ищите товары и добавляйте их в корзину,
            избранное или сравнение.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#6D4AFF] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          Найдено: {filteredProducts.length}
        </div>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-6">
        <aside className="h-fit rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-black">Категории</h2>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`flex h-12 w-full items-center justify-between rounded-2xl px-4 text-left text-sm font-bold transition ${
                selectedCategory === "all"
                  ? "bg-[#F1EDFF] text-[#6D4AFF]"
                  : "text-[#111827] hover:bg-[#F6F7FB]"
              }`}
            >
              Все товары
              <span>{products.length}</span>
            </button>

            {categories.map((category) => {
              const Icon = category.icon;
              const count = products.filter((product) =>
                product.categoryIds.includes(category.id),
              ).length;

              return (
                <button
                  key={category.id}
                  type="button"
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
                </button>
              );
            })}
          </div>
        </aside>

        <div>
          <div className="mb-5 flex gap-3 rounded-[28px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="relative flex-1">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Найти товар в каталоге..."
                className="h-12 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-[#6D4AFF] focus:bg-white"
              />
            </div>

            <label className="flex h-12 min-w-[230px] items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm font-bold text-[#111827]">
              <SlidersHorizontal size={18} className="text-[#6D4AFF]" />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortType)}
                className="min-w-0 flex-1 bg-transparent outline-none"
              >
                <option value="popular">Популярные</option>
                <option value="rating">По рейтингу</option>
                <option value="price-low">Сначала дешевле</option>
                <option value="price-high">Сначала дороже</option>
              </select>
            </label>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[32px] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <h2 className="text-2xl font-black">Ничего не найдено</h2>
              <p className="mt-3 max-w-[420px] text-[#6B7280]">
                Попробуйте изменить запрос или выбрать другую категорию.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedCategory("all");
                }}
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
