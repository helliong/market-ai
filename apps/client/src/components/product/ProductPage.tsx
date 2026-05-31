"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { addToCart, decreaseQuantity, increaseQuantity } from "@/store/cartSlice";
import { toggleCompare } from "@/store/compareSlice";
import { toggleFavorite } from "@/store/favoritesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useLanguage } from "@/hooks/useLanguage";

type Product = {
  id: number;
  title: string;
  price: string;
  oldPrice?: string;
  rating: number;
  reviews: number;
  badge?: string;
  storeName?: string;
};

type ProductPageProps = {
  product: Product;
};

const specs = [
  ["warranty", "12months"],
  ["deliveryOption", "todayOrTomorrow"],
  ["paymentOption", "cardOnDelivery"],
  ["returnOption", "14days"],
];
export function ProductPage({ product }: ProductPageProps) {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const cartItem = useAppSelector((state) => state.cart.items.find((item) => item.id === product.id));
  const isFavorite = useAppSelector((state) => state.favorites.ids.includes(product.id));
  const isCompared = useAppSelector((state) => state.compare.ids.includes(product.id));
  const isCompareLimitReached = useAppSelector((state) => state.compare.ids.length >= 6);
  const isCompareDisabled = !isCompared && isCompareLimitReached;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#6B7280]">
        <Link href="/" className="transition hover:text-[#6D4AFF]">{t("homeBreadcrumb")}</Link><span>/</span><span className="text-[#111827]">{product.title}</span>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-8">
        <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="relative flex min-h-[320px] items-center justify-center rounded-[28px] bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF] md:min-h-[520px]">
            {product.badge && <span className="absolute left-6 top-6 rounded-full bg-white px-4 py-2 text-sm font-black text-[#6D4AFF] shadow-[0_8px_24px_rgba(15,23,42,0.08)]">{product.badge}</span>}
            <div className="h-40 w-52 rounded-[34px] bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] shadow-[0_28px_70px_rgba(79,50,217,0.26)] md:h-64 md:w-80 md:rounded-[42px]" />
          </div>
        </div>
        <aside className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <h1 className="text-2xl font-black leading-tight tracking-[-0.03em] md:text-3xl">{product.title}</h1>
          <div className="mt-4 flex items-center gap-2 text-sm"><Star size={18} className="fill-[#F59E0B] text-[#F59E0B]" /><span className="font-black">{product.rating}</span><span className="text-[#6B7280]">• {product.reviews} {t("reviewsCount")}</span></div>
          <div className="mt-6 flex items-end gap-3"><span className="text-3xl font-black tracking-[-0.04em] md:text-4xl">{product.price}</span>{product.oldPrice && <span className="mb-1 text-lg text-[#9CA3AF] line-through">{product.oldPrice}</span>}</div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cartItem ? (
              <div className="col-span-2 grid h-13 grid-cols-[56px_1fr_56px] overflow-hidden rounded-2xl bg-[#6D4AFF] text-white">
                <button type="button" onClick={() => dispatch(decreaseQuantity(product.id))} className="flex items-center justify-center transition hover:bg-[#4F32D9]" aria-label={t("decreaseQuantity")}><Minus size={19} /></button>
                <div className="flex items-center justify-center text-sm font-black">{cartItem.quantity} {t("inCart")}</div>
                <button type="button" onClick={() => dispatch(increaseQuantity(product.id))} className="flex items-center justify-center transition hover:bg-[#4F32D9]" aria-label={t("increaseQuantity")}><Plus size={19} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => dispatch(addToCart({ id: product.id, title: product.title, price: product.price }))} className="col-span-2 flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#6D4AFF] text-sm font-bold text-white transition hover:bg-[#4F32D9]"><ShoppingCart size={19} /> {t("addToCartShort")}</button>
            )}
            <button type="button" onClick={() => dispatch(toggleFavorite(product.id))} className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition ${isFavorite ? "bg-[#FEF2F2] text-[#EF4444]" : "bg-[#F6F7FB] text-[#111827] hover:text-[#EF4444]"}`}><Heart size={18} className={isFavorite ? "fill-[#EF4444]" : undefined} /> {t("addToFavorites")}</button>
            <button type="button" onClick={() => dispatch(toggleCompare(product.id))} disabled={isCompareDisabled} title={isCompareDisabled ? "В сравнении может быть не больше 6 товаров" : "Добавить в сравнение"} className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition ${isCompared ? "bg-[#F1EDFF] text-[#6D4AFF]" : "bg-[#F6F7FB] text-[#111827] hover:text-[#6D4AFF] disabled:opacity-50"}`}><Scale size={18} /> {t("addToCompare")}</button>
          </div>
          <div className="mt-6 space-y-3 rounded-[24px] bg-[#F6F7FB] p-5">
            <ProductBenefit icon={<Truck size={20} />} label={t("fastDelivery")} />
            <ProductBenefit icon={<ShieldCheck size={20} />} label={t("officialWarranty")} />
            <ProductBenefit icon={<RotateCcw size={20} />} label={t("easyReturn")} />
          </div>

          {product.storeName && (
            <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-[#E5E7EB] bg-white p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF]">
                <Store size={21} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                  Продавец
                </p>
                <p className="mt-1 truncate text-base font-black text-[#111827]">
                  {product.storeName}
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px] lg:gap-8">
        <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-black tracking-[-0.03em]">{t("aboutProduct")}</h2>
          <p className="mt-4 max-w-[760px] leading-7 text-[#6B7280]">{product.title} подойдет для повседневных задач, работы и покупок без лишней суеты. Карточка собрана в стиле MarketAI и использует актуальные действия магазина: корзина, избранное и сравнение.</p>
        </div>
        <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-black tracking-[-0.03em]">{t("specifications")}</h2>
          <div className="mt-5 space-y-3">
            {specs.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 text-sm last:border-b-0 last:pb-0">
                <span className="text-[#6B7280]">{t(key)}</span>
                <span className="font-bold text-[#111827]">{t(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductBenefit({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-3 text-sm font-bold text-[#111827]"><span className="text-[#6D4AFF]">{icon}</span><span className="flex-1">{label}</span><CheckCircle2 size={18} className="text-[#22C55E]" /></div>
  );
}