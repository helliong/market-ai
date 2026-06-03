"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { products } from "@/data/products";
import { ProductCard } from "@/components/ui/ProductCard";
import { useAppSelector } from "@/store/hooks";
import { useLanguage } from "@/hooks/useLanguage";

export function FavoritesPage() {
  const { t } = useLanguage();
  const favoriteIds = useAppSelector((state) => state.favorites.ids);
  const favoriteProducts = products.filter((product) => favoriteIds.includes(product.id));

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black md:text-4xl">{t("favoritesTitle")}</h1>
          <p className="mt-2 text-[#6B7280]">{t("favoritesSubtitle")}</p>
        </div>
        <Link href="/" className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#6D4AFF] shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#F1EDFF]">{t("continueShopping")}</Link>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] bg-white p-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F1EDFF] text-[#6D4AFF]"><Heart size={38} /></div>
          <h2 className="mt-6 text-2xl font-black">{t("favoritesEmpty")}</h2>
          <p className="mt-3 max-w-[420px] text-[#6B7280]">{t("favoritesEmptyMessage")}</p>
          <Link href="/" className="mt-6 rounded-2xl bg-[#6D4AFF] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#4F32D9]">{t("goHome")}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">{favoriteProducts.map((product) => <ProductCard key={product.id} {...product} showTomorrowCartButton />)}</div>
      )}
    </section>
  );
}
