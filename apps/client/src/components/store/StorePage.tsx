"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Flag,
  MapPin,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { categories } from "@/data/categories";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { getStoreSlug } from "@/lib/store-slug";
import { ProductCard } from "@/components/ui/ProductCard";

type StorePageProps = {
  storeName: string;
};

const tabs = ["Товары", "О магазине", "Отзывы", "Доставка и оплата"];
type StoreSort = "popular" | "rating" | "priceAsc" | "priceDesc";

// Экран магазина показывает витрину, статистику, товары и доверительные преимущества продавца.
export function StorePage({ storeName }: StorePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all",
  );
  const [sort, setSort] = useState<StoreSort>("popular");
  const products = useCatalogProducts();
  const storeProducts = products.filter(
    (product) => product.storeName?.toLowerCase() === storeName.toLowerCase(),
  );
  const categoryIds = Array.from(
    new Set(storeProducts.flatMap((product) => product.categoryIds)),
  );
  const storeCategories = categories.filter((category) =>
    categoryIds.includes(category.id),
  );
  const reviewsCount = storeProducts.reduce(
    (sum, product) => sum + product.reviews,
    0,
  );
  const rating =
    storeProducts.length > 0
      ? (
          storeProducts.reduce((sum, product) => sum + product.rating, 0) /
          storeProducts.length
        ).toFixed(1)
      : "4.8";
  const heroBackground = getStoreHeroBackground(storeName);
  const filteredStoreProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = storeProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" ||
        product.categoryIds.includes(selectedCategory);
      const matchesSearch =
        !normalizedQuery ||
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.badge?.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((left, right) => {
      if (sort === "rating") {
        return right.rating - left.rating;
      }
      if (sort === "priceAsc") {
        return parseProductPrice(left.price) - parseProductPrice(right.price);
      }
      if (sort === "priceDesc") {
        return parseProductPrice(right.price) - parseProductPrice(left.price);
      }
      return right.reviews - left.reviews;
    });
  }, [searchQuery, selectedCategory, sort, storeProducts]);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/catalog"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#6D4AFF] transition hover:text-[#4F32D9]"
      >
        <ChevronLeft size={18} />
        В каталог
      </Link>

      <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div
          className="relative min-h-[180px] p-5 text-white md:min-h-[240px] md:p-8"
          style={{ background: heroBackground }}
        >
          <div className="absolute inset-0 bg-black/38" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="relative z-10 flex h-full min-h-[140px] flex-col justify-between gap-8 md:min-h-[188px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/16 px-3 py-1.5 text-xs font-black backdrop-blur">
                <ShieldCheck size={15} />
                Проверенный продавец
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/16 px-3 py-1.5 text-xs font-black backdrop-blur">
                <MapPin size={15} />
                Алматы
              </span>
            </div>

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-white/35 bg-white text-3xl font-black text-[#6D4AFF] shadow-[0_18px_45px_rgba(15,23,42,0.18)] md:h-24 md:w-24">
                  {storeName.charAt(0).toUpperCase()}
                </div>
                <div className="rounded-[24px] bg-black/28 p-4 backdrop-blur-sm md:bg-black/20">
                  <h1 className="text-3xl font-black tracking-[-0.04em] text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.55)] md:text-5xl">
                    {storeName}
                  </h1>
                  <p className="mt-2 max-w-[680px] text-sm font-semibold text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] md:text-base">
                    Подборка товаров от продавца MarketAI: актуальные позиции,
                    проверенный профиль и понятные условия покупки.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#111827] transition hover:bg-[#F6F7FB]"
                >
                  <Users size={18} />
                  Подписаться
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/16 px-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/22"
                >
                  <MessageCircle size={18} />
                  Написать
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16 text-white backdrop-blur transition hover:bg-white/22"
                  aria-label="Пожаловаться"
                >
                  <Flag size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-[#E5E7EB] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <StoreStat icon={<Star />} label="Рейтинг" value={rating} />
          <StoreStat icon={<MessageCircle />} label="Отзывы" value={reviewsCount} />
          <StoreStat icon={<Package />} label="Товаров" value={storeProducts.length} />
          <StoreStat icon={<CalendarDays />} label="На MarketAI" value="с 2026" />
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {tabs.map((tab, index) => (
            <a
              key={tab}
              href={`#${tab.toLowerCase().replace(/\s+/g, "-")}`}
              className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-black transition ${
                index === 0
                  ? "bg-[#6D4AFF] text-white shadow-[0_10px_24px_rgba(109,74,255,0.22)] hover:bg-[#4F32D9]"
                  : "text-[#6B7280] hover:bg-[#F6F7FB] hover:text-[#6D4AFF]"
              }`}
            >
              {tab}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section
            id="товары"
            className="rounded-[28px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.03em]">
                  Товары магазина
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                  Найдено {filteredStoreProducts.length} из{" "}
                  {storeProducts.length} товаров продавца.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex h-11 items-center gap-2 rounded-2xl bg-[#F6F7FB] px-4 text-sm font-semibold text-[#6B7280]">
                  <Search size={17} />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full bg-transparent outline-none placeholder:text-[#9CA3AF]"
                    placeholder="Поиск в магазине"
                  />
                </label>
                <label className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#F6F7FB] px-4 text-sm font-black text-[#111827] transition focus-within:text-[#6D4AFF]">
                  <SlidersHorizontal size={17} />
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as StoreSort)}
                    className="bg-transparent font-black outline-none"
                    aria-label="Сортировка товаров магазина"
                  >
                    <option value="popular">Популярные</option>
                    <option value="rating">Высокий рейтинг</option>
                    <option value="priceAsc">Сначала дешевле</option>
                    <option value="priceDesc">Сначала дороже</option>
                  </select>
                </label>
              </div>
            </div>

            {storeCategories.length > 0 && (
              <div className="mt-5 flex gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                    selectedCategory === "all"
                      ? "bg-[#111827] text-white"
                      : "bg-[#F6F7FB] text-[#6B7280] hover:text-[#6D4AFF]"
                  }`}
                >
                  Все
                </button>
                {storeCategories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-black transition ${
                      selectedCategory === category.id
                        ? "bg-[#111827] text-white"
                        : "bg-[#F6F7FB] text-[#6B7280] hover:text-[#6D4AFF]"
                    }`}
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            )}

            {filteredStoreProducts.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 xl:gap-5">
                {filteredStoreProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-[24px] bg-[#F6F7FB] p-8 text-center">
                <h3 className="text-2xl font-black">Ничего не найдено</h3>
                <p className="mt-2 max-w-[420px] text-[#6B7280]">
                  Попробуйте изменить запрос, категорию или сортировку.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSort("popular");
                  }}
                  className="mt-5 rounded-2xl bg-[#6D4AFF] px-5 py-3 text-sm font-black text-white transition hover:bg-[#4F32D9]"
                >
                  Сбросить фильтры
                </button>
              </div>
            )}
          </section>

          <section
            id="о-магазине"
            className="rounded-[28px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
          >
            <h2 className="text-2xl font-black tracking-[-0.03em]">
              О магазине
            </h2>
            <p className="mt-4 leading-7 text-[#6B7280]">
              {storeName} - магазин на MarketAI с проверенным профилем продавца.
              Здесь будет описание магазина, специализация, город, правила
              работы, гарантия и информация, которую продавец заполнит в своем
              кабинете.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoRow label="Город" value="Алматы" />
              <InfoRow label="Категории" value={storeCategories.length.toString()} />
              <InfoRow label="Время ответа" value="до 2 часов" />
              <InfoRow label="Юр. данные" value="проверены MarketAI" />
            </div>
          </section>

          <section
            id="отзывы"
            className="rounded-[28px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
          >
            <h2 className="text-2xl font-black tracking-[-0.03em]">Отзывы</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="rounded-[24px] bg-[#F6F7FB] p-5">
                <div className="flex items-center gap-2">
                  <Star size={22} className="fill-[#F59E0B] text-[#F59E0B]" />
                  <span className="text-3xl font-black">{rating}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#6B7280]">
                  На основе {reviewsCount} отзывов о товарах магазина.
                </p>
              </div>
              <div className="rounded-[24px] border border-[#E5E7EB] p-5">
                <p className="font-black text-[#111827]">
                  Отзывы о магазине появятся здесь
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  Пока используем агрегированные отзывы товаров. Позже сюда
                  можно подключить отдельные отзывы о продавце и фильтры.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-black tracking-[-0.03em]">
              Проверка магазина
            </h2>
            <div className="mt-5 space-y-4">
              <TrustRow label="Email продавца подтвержден" />
              <TrustRow label="Legal data проверены" />
              <TrustRow label="Магазин активен" />
              <TrustRow label="Покупки защищены MarketAI" />
            </div>
          </section>

          <section
            id="доставка-и-оплата"
            className="rounded-[28px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
          >
            <h2 className="text-xl font-black tracking-[-0.03em]">
              Доставка и оплата
            </h2>
            <div className="mt-5 space-y-4">
              <StoreBenefit
                icon={<Truck size={20} />}
                title="Доставка"
                text="По городу и регионам, точные условия появятся из настроек продавца."
              />
              <StoreBenefit
                icon={<Clock3 size={20} />}
                title="Сроки"
                text="Обычно 1-3 дня, для части товаров доступна быстрая доставка."
              />
              <StoreBenefit
                icon={<ShieldCheck size={20} />}
                title="Возврат"
                text="Базовая политика возврата MarketAI, затем подключим правила магазина."
              />
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

// Преобразует цену товара из строки в число для сортировки витрины магазина.
function parseProductPrice(price: string) {
  return Number(price.replace(/[^\d]/g, "")) || 0;
}

// Подбирает стабильный фон hero-блока магазина на основе названия магазина.
function getStoreHeroBackground(storeName: string) {
  const palettes = [
    {
      base: "#0B1020",
      mid: "#4F32D9",
      end: "#15803D",
      glowA: "rgba(185,247,209,0.55)",
      glowB: "rgba(109,74,255,0.45)",
    },
    {
      base: "#111827",
      mid: "#0F766E",
      end: "#7C3AED",
      glowA: "rgba(94,234,212,0.48)",
      glowB: "rgba(196,181,253,0.42)",
    },
    {
      base: "#101828",
      mid: "#BE123C",
      end: "#4338CA",
      glowA: "rgba(251,113,133,0.42)",
      glowB: "rgba(129,140,248,0.44)",
    },
    {
      base: "#0F172A",
      mid: "#0369A1",
      end: "#65A30D",
      glowA: "rgba(125,211,252,0.46)",
      glowB: "rgba(190,242,100,0.38)",
    },
    {
      base: "#18181B",
      mid: "#B45309",
      end: "#0E7490",
      glowA: "rgba(251,191,36,0.42)",
      glowB: "rgba(103,232,249,0.36)",
    },
    {
      base: "#020617",
      mid: "#C026D3",
      end: "#2563EB",
      glowA: "rgba(232,121,249,0.42)",
      glowB: "rgba(147,197,253,0.42)",
    },
  ];
  const index = getStableStoreIndex(storeName, palettes.length);
  const palette = palettes[index];
  const angle = 125 + index * 11;
  const glowX = 14 + index * 9;
  const glowY = 18 + (index % 3) * 12;

  return [
    `radial-gradient(circle at ${glowX}% ${glowY}%, ${palette.glowA} 0, transparent 28%)`,
    `radial-gradient(circle at ${82 - index * 4}% ${24 + index * 5}%, ${palette.glowB} 0, transparent 30%)`,
    `linear-gradient(${angle}deg, ${palette.base} 0%, ${palette.mid} 52%, ${palette.end} 100%)`,
  ].join(", ");
}

// Получает стабильный индекс из строки, чтобы визуальные варианты не менялись между рендерами.
function getStableStoreIndex(value: string, modulo: number) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % modulo;
}

// Компактная карточка метрики магазина в hero-блоке.
function StoreStat({
  icon,
  label,
  value,
}: {
  icon: ReactElement;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] bg-[#F6F7FB] p-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#6D4AFF]">
        {icon}
      </span>
      <div>
        <p className="text-lg font-black text-[#111827]">{value}</p>
        <p className="text-xs font-bold text-[#6B7280]">{label}</p>
      </div>
    </div>
  );
}

// Строка с парой "название-значение" для информации о магазине.
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F6F7FB] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
        {label}
      </p>
      <p className="mt-1 font-black text-[#111827]">{value}</p>
    </div>
  );
}

// Строка доверия с галочкой для преимуществ магазина.
function TrustRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-bold text-[#111827]">
      <CheckCircle2 size={19} className="shrink-0 text-[#22C55E]" />
      <span>{label}</span>
    </div>
  );
}

// Карточка преимущества магазина с иконкой и описанием.
function StoreBenefit({
  icon,
  title,
  text,
}: {
  icon: ReactElement;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF]">
        {icon}
      </span>
      <div>
        <p className="font-black text-[#111827]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#6B7280]">{text}</p>
      </div>
    </div>
  );
}
