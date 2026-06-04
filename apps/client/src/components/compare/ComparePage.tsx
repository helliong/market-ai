"use client";

import Link from "next/link";
import { Minus, Plus, Scale, ShoppingCart, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { COMPARE_LIMIT, toggleCompare } from "@/store/compareSlice";
import { addToCart, decreaseQuantity, increaseQuantity } from "@/store/cartSlice";
import { useLanguage } from "@/hooks/useLanguage";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";

// Экран сравнения выводит выбранные товары и их основные характеристики рядом.
export function ComparePage() {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const compareIds = useAppSelector((state) => state.compare.ids);
  const cartItems = useAppSelector((state) => state.cart.items);
  const products = useCatalogProducts();
  const compareProducts = products.filter((product) => compareIds.includes(product.id));

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em] md:text-4xl">{t("compareTitle")}</h1>
          <p className="mt-2 text-[#6B7280]">{t("compareSubtitle")} {compareProducts.length}/{COMPARE_LIMIT}</p>
        </div>
        <Link href="/" className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#6D4AFF] shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#F1EDFF]">{t("continueShopping")}</Link>
      </div>

      {compareProducts.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] bg-white p-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F1EDFF] text-[#6D4AFF]"><Scale size={38} /></div>
          <h2 className="mt-6 text-2xl font-black">{t("compareEmpty")}</h2>
          <p className="mt-3 max-w-[420px] text-[#6B7280]">{t("compareEmptyMessage")}</p>
          <Link href="/" className="mt-6 rounded-2xl bg-[#6D4AFF] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#4F32D9]">{t("goHome")}</Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[32px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `180px repeat(${compareProducts.length}, minmax(170px, 1fr))` }}>
            <div className="border-b border-[#E5E7EB] bg-[#F6F7FB] p-5 font-bold">{t("product")}</div>
            {compareProducts.map((product) => (
              <div key={product.id} className="border-b border-[#E5E7EB] p-5">
                <Link href={`/products/${product.id}`} className="block h-36 rounded-[24px] bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF] transition hover:opacity-85" aria-label={`Открыть ${product.title}`} />
                <Link href={`/products/${product.id}`} className="mt-4 block min-h-[44px] text-sm font-black text-[#111827] transition hover:text-[#6D4AFF]">{product.title}</Link>
                <p className="mt-3 text-2xl font-black">{product.price}</p>
                <div className="mt-4 flex gap-2">
                  <CompareCartAction product={product} quantity={cartItems.find((item) => item.id === product.id)?.quantity} onAdd={() => dispatch(addToCart({ id: product.id, title: product.title, price: product.price }))} onDecrease={() => dispatch(decreaseQuantity(product.id))} onIncrease={() => dispatch(increaseQuantity(product.id))} />
                  <button onClick={() => dispatch(toggleCompare(product.id))} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#EF4444]"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            <CompareRow label={t("rating")} values={compareProducts.map((p) => String(p.rating))} />
            <CompareRow label={t("reviewsCount")} values={compareProducts.map((p) => `${p.reviews} ${t("reviewsCount")}`)} />
            <CompareRow label={t("oldPrice")} values={compareProducts.map((p) => p.oldPrice || "—")} />
            <CompareRow label={t("status")} values={compareProducts.map((p) => p.badge || "—")} />
            <CompareRow label={t("deliveryCost")} values={compareProducts.map(() => t("deliveryAvailableShort"))} />
          </div>
        </div>
      )}
    </section>
  );
}

// Кнопки управления корзиной прямо внутри таблицы сравнения.
function CompareCartAction({ product, quantity, onAdd, onDecrease, onIncrease }: any) {
  const { t } = useLanguage();
  if (quantity) {
    return (
      <div className="grid h-10 flex-1 grid-cols-[36px_1fr_36px] overflow-hidden rounded-2xl bg-[#6D4AFF] text-white">
        <button type="button" onClick={onDecrease} className="flex items-center justify-center transition hover:bg-[#4F32D9]"><Minus size={15} /></button>
        <div className="flex items-center justify-center text-xs font-black">{quantity} {t("inCart")}</div>
        <button type="button" onClick={onIncrease} className="flex items-center justify-center transition hover:bg-[#4F32D9]"><Plus size={15} /></button>
      </div>
    );
  }
  return (
    <button type="button" onClick={onAdd} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#6D4AFF] text-xs font-bold text-white transition hover:bg-[#4F32D9]"><ShoppingCart size={16} /> {t("addToCartShort")}</button>
  );
}

// Одна строка сравнительной таблицы с названием характеристики и значениями товаров.
function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <>
      <div className="border-b border-[#E5E7EB] bg-[#F6F7FB] p-5 text-sm font-bold">{label}</div>
      {values.map((value, index) => <div key={`${label}-${index}`} className="border-b border-[#E5E7EB] p-5 text-sm font-semibold">{value}</div>)}
    </>
  );
}
