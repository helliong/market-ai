"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Heart,
  Minus,
  Plus,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Star,
} from "lucide-react";
import { addToCart, decreaseQuantity, increaseQuantity } from "@/store/cartSlice";
import { toggleCompare } from "@/store/compareSlice";
import { toggleFavorite } from "@/store/favoritesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { getStoreSlug } from "@/lib/store-slug";
import { categories } from "@/data/categories";
import { getMainProductImageUrl } from "@/lib/product-image";
import { getPublicStoreProfile } from "@/lib/auth-api";
import type { PublicStoreProfile } from "@/lib/auth-api";

type Product = {
  id: number;
  title: string;
  price: string;
  oldPrice?: string;
  rating: number;
  reviews: number;
  badge?: string;
  description?: string;
  storeName?: string;
  categoryIds?: number[];
  category?: string;
  images?: ProductImage[];
};

type ProductPageProps = {
  product: Product;
};

type ProductImage = {
  id: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
};

const specs = [
  ["warranty", "12months"],
  ["deliveryOption", "todayOrTomorrow"],
  ["paymentOption", "cardOnDelivery"],
  ["returnOption", "14days"],
];
// Страница товара показывает фото, цену, характеристики и действия покупки.
export function ProductPage({ product }: ProductPageProps) {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const galleryImages = product.images?.length ? product.images : [];
  const mainImageIndex = Math.max(
    galleryImages.findIndex((image) => image.isMain),
    0,
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(mainImageIndex);
  const [storeProfile, setStoreProfile] = useState<PublicStoreProfile | null>(
    null,
  );
  const selectedImage =
    galleryImages[selectedImageIndex] ?? galleryImages[0] ?? null;
  const cartImageUrl = getMainProductImageUrl(galleryImages);
  const cartItem = useAppSelector((state) => state.cart.items.find((item) => item.id === product.id));
  const isFavorite = useAppSelector((state) => state.favorites.ids.includes(product.id));
  const isCompared = useAppSelector((state) => state.compare.ids.includes(product.id));
  const isCompareLimitReached = useAppSelector((state) => state.compare.ids.length >= 6);
  const isCompareDisabled = !isCompared && isCompareLimitReached;
  const productCategory = product.categoryIds
    ? categories.find((category) => product.categoryIds?.includes(category.id))
    : undefined;

  useEffect(() => {
    if (!product.storeName) {
      setStoreProfile(null);
      return;
    }

    let isMounted = true;

    getPublicStoreProfile(product.storeName)
      .then((profile) => {
        if (isMounted) {
          setStoreProfile(profile);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStoreProfile(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [product.storeName]);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#6B7280]">
        {productCategory && (
          <>
            <Link
              href={`/catalog?category=${productCategory.id}`}
              className="transition hover:text-[#6D4AFF]"
            >
              {t(productCategory.title)}
            </Link>
            <span>/</span>
          </>
        )}
        {product.category && (
          <>
            <Link
              href={`/catalog?category=${productCategory?.id ?? 1}&subcategory=${encodeURIComponent(product.category)}`}
              className="transition hover:text-[#6D4AFF]"
            >
              {product.category}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="min-w-0 break-words text-[var(--text-main)] [overflow-wrap:anywhere]">
          {product.title}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-8">
        <div className="rounded-[32px] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-4">
          <div className="grid gap-3 md:grid-cols-[74px_minmax(0,1fr)]">
            <div className="order-2 flex gap-2 overflow-x-auto pb-1 md:order-1 md:max-h-[640px] md:flex-col md:overflow-y-auto md:overflow-x-hidden md:pb-0">
              {galleryImages.length > 0 ? (
                galleryImages.map((image, index) => {
                  const isSelected = index === selectedImageIndex;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      aria-label={`Показать фото ${index + 1}`}
                      className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#F6F7FB] transition md:h-[88px] md:w-[68px] ${
                        isSelected
                          ? "border-[#6D4AFF] shadow-[0_8px_20px_rgba(109,74,255,0.20)]"
                          : "border-transparent hover:border-[#D8D0FF]"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${product.title}, фото ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </button>
                  );
                })
              ) : (
                <div className="h-20 w-16 shrink-0 rounded-xl border-2 border-[#6D4AFF] bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF] md:h-[88px] md:w-[68px]" />
              )}
            </div>

            <div className="order-1 flex aspect-[3/4] min-h-[360px] items-center justify-center overflow-hidden rounded-[28px] bg-[#F6F7FB] md:order-2 md:min-h-[640px]">
              {selectedImage ? (
                <img
                  src={selectedImage.url}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-40 w-52 rounded-[34px] bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] shadow-[0_28px_70px_rgba(79,50,217,0.26)] md:h-64 md:w-80 md:rounded-[42px]" />
              )}
            </div>
          </div>
        </div>
        <aside className="min-w-0 h-fit self-start rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <h1 className="break-words text-2xl font-black leading-tight tracking-[-0.03em] [overflow-wrap:anywhere] md:text-3xl">{product.title}</h1>
          <div className="mt-4 flex items-center gap-2 text-sm"><Star size={18} className="fill-[#F59E0B] text-[#F59E0B]" /><span className="font-black">{product.rating}</span><span className="text-[#6B7280]">• {product.reviews} {t("reviewsCount")}</span></div>
          <div className="mt-6 flex items-end gap-3"><span className="text-3xl font-black tracking-[-0.04em] md:text-4xl">{product.price}</span>{product.oldPrice && <span className="mb-1 text-lg text-[#9CA3AF] line-through">{product.oldPrice}</span>}</div>
          <div className="product-actions mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cartItem ? (
              <div className="col-span-full grid h-13 grid-cols-[56px_1fr_56px] overflow-hidden rounded-2xl bg-[#6D4AFF] text-white">
                <button type="button" onClick={() => dispatch(decreaseQuantity(product.id))} className="flex items-center justify-center transition hover:bg-[#4F32D9]" aria-label={t("decreaseQuantity")}><Minus size={19} /></button>
                <div className="flex items-center justify-center text-sm font-black">{cartItem.quantity} {t("inCart")}</div>
                <button type="button" onClick={() => dispatch(increaseQuantity(product.id))} className="flex items-center justify-center transition hover:bg-[#4F32D9]" aria-label={t("increaseQuantity")}><Plus size={19} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => dispatch(addToCart({ id: product.id, title: product.title, price: product.price, oldPrice: product.oldPrice, imageUrl: cartImageUrl }))} className="col-span-full flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#6D4AFF] text-sm font-bold text-white transition hover:bg-[#4F32D9]"><ShoppingCart size={19} /> {t("addToCartShort")}</button>
            )}
            <button type="button" onClick={() => dispatch(toggleFavorite(product.id))} className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition ${isFavorite ? "bg-[#FEF2F2] text-[#EF4444]" : "bg-[#F6F7FB] text-[#111827] hover:text-[#EF4444]"}`}><Heart size={18} className={isFavorite ? "fill-[#EF4444]" : undefined} /> {t("addToFavorites")}</button>
            <button type="button" onClick={() => dispatch(toggleCompare(product.id))} disabled={isCompareDisabled} title={isCompareDisabled ? "В сравнении может быть не больше 6 товаров" : "Добавить в сравнение"} className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition ${isCompared ? "bg-[#F1EDFF] text-[#6D4AFF]" : "bg-[#F6F7FB] text-[#111827] hover:text-[#6D4AFF] disabled:opacity-50"}`}><Scale size={18} /> {t("addToCompare")}</button>
          </div>
          {product.storeName && (
            <Link href={`/stores/${getStoreSlug(product.storeName)}`} className="mt-4 flex items-center gap-3 rounded-[24px] border border-[#E5E7EB] bg-white p-5 transition hover:border-[#6D4AFF] hover:bg-[#F8F7FF]">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#111827] text-base font-black text-[#6D4AFF]">
                {storeProfile?.avatarUrl ? (
                  <img
                    src={storeProfile.avatarUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  product.storeName.charAt(0).toUpperCase()
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                  Продавец
                </p>
                <p className="mt-1 truncate text-base font-black text-[#111827]">
                  {product.storeName}
                </p>
              </div>
            </Link>
          )}

          <div className="mt-4 rounded-[24px] border border-[#E5E7EB] bg-white p-5">
            <h2 className="text-xl font-black tracking-[-0.03em]">{t("specifications")}</h2>
            <div className="mt-5 space-y-3">
              {specs.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 text-sm last:border-b-0 last:pb-0">
                  <span className="text-[#6B7280]">{t(key)}</span>
                  <span className="font-bold text-[#111827]">{t(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <div className="mt-8">
        <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-black tracking-[-0.03em]">{t("aboutProduct")}</h2>
          <p className="mt-4 max-w-none whitespace-pre-wrap break-words leading-7 text-[#6B7280] [overflow-wrap:break-word]">
            {product.description ||
              `${product.title} подойдет для повседневных задач, работы и покупок без лишней суеты.`}
          </p>
        </div>
      </div>
    </section>
  );
}

