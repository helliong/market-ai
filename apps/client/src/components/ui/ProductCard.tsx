"use client";

import Link from "next/link";
import { Heart, Minus, Plus, Scale, ShoppingCart, Star, Store } from "lucide-react";
import { addToCart, decreaseQuantity, increaseQuantity } from "@/store/cartSlice";
import { toggleCompare } from "@/store/compareSlice";
import { toggleFavorite } from "@/store/favoritesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type ProductCardProps = {
  id: number;
  title: string;
  price: string;
  oldPrice?: string;
  rating: number;
  reviews: number;
  badge?: string;
  storeName?: string;
};

export function ProductCard({
  id,
  title,
  price,
  oldPrice,
  rating,
  reviews,
  badge,
  storeName,
}: ProductCardProps) {
  const dispatch = useAppDispatch();
  const cartItem = useAppSelector((state) =>
    state.cart.items.find((item) => item.id === id),
  );
  const isFavorite = useAppSelector((state) => state.favorites.ids.includes(id));
  const isCompared = useAppSelector((state) => state.compare.ids.includes(id));
  const isCompareLimitReached = useAppSelector(
    (state) => state.compare.ids.length >= 6,
  );
  const isCompareDisabled = !isCompared && isCompareLimitReached;

  return (
    <article className="group relative rounded-[18px] bg-white p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(109,74,255,0.14)] sm:rounded-[24px] sm:p-4">
      {badge && (
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-[#F1EDFF] px-2 py-1 text-[10px] font-bold text-[#6D4AFF] sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
          {badge}
        </span>
      )}

      <div className="absolute right-2.5 top-2.5 z-10 flex gap-1.5 sm:right-4 sm:top-4 sm:gap-2">
        <button
          type="button"
          onClick={() => dispatch(toggleCompare(id))}
          disabled={isCompareDisabled}
          aria-label="Добавить в сравнение"
          title={
            isCompareDisabled
              ? "В сравнении может быть не больше 6 товаров"
              : "Добавить в сравнение"
          }
          className={`hidden h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:text-[#6D4AFF] disabled:opacity-50 sm:flex sm:h-9 sm:w-9 ${
            isCompared ? "text-[#6D4AFF]" : "text-[#6B7280]"
          }`}
        >
          <Scale size={16} className="sm:h-[18px] sm:w-[18px]" />
        </button>

        <button
          type="button"
          onClick={() => dispatch(toggleFavorite(id))}
          aria-label="Добавить в избранное"
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:text-[#EF4444] sm:h-9 sm:w-9 ${
            isFavorite ? "text-[#EF4444]" : "text-[#6B7280]"
          }`}
        >
          <Heart
            size={16}
            className={`${isFavorite ? "fill-[#EF4444]" : ""} sm:h-[18px] sm:w-[18px]`}
          />
        </button>
      </div>

      <Link
        href={`/products/${id}`}
        className="flex h-[120px] items-center justify-center rounded-[16px] bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF] sm:h-[190px] sm:rounded-[20px]"
      >
        <div className="h-14 w-20 rounded-[16px] bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] shadow-[0_18px_40px_rgba(79,50,217,0.22)] transition group-hover:scale-105 sm:h-24 sm:w-32 sm:rounded-[22px]" />
      </Link>

      <div className="mt-3 sm:mt-4">
        <Link
          href={`/products/${id}`}
          className="line-clamp-2 min-h-[36px] text-[12px] font-bold leading-[1.35] text-[#111827] transition hover:text-[#6D4AFF] sm:min-h-[44px] sm:text-[15px] sm:leading-[1.45]"
        >
          {title}
        </Link>

        {storeName && (
          <div className="mt-2 flex min-h-[18px] items-center gap-1.5 text-[11px] font-semibold text-[#6B7280] sm:text-xs">
            <Store size={13} className="shrink-0 text-[#6D4AFF] sm:h-3.5 sm:w-3.5" />
            <span className="line-clamp-1">{storeName}</span>
          </div>
        )}

        <div className="mt-3 hidden items-center gap-1 text-sm sm:flex">
          <Star size={16} className="fill-[#F59E0B] text-[#F59E0B]" />
          <span className="font-bold">{rating}</span>
          <span className="text-[#6B7280]">• {reviews} отзывов</span>
        </div>

        <div className="mt-3 flex flex-col items-start gap-0.5 sm:mt-4 sm:flex-row sm:items-end sm:gap-2">
          <span className="text-base font-black sm:text-2xl">{price}</span>

          {oldPrice && (
            <span className="text-xs text-[#9CA3AF] line-through sm:mb-1 sm:text-sm">
              {oldPrice}
            </span>
          )}
        </div>

        {cartItem ? (
          <div className="mt-3 grid h-10 grid-cols-[36px_1fr_36px] overflow-hidden rounded-xl bg-[#6D4AFF] text-white sm:mt-4 sm:h-11 sm:grid-cols-[44px_1fr_44px] sm:rounded-2xl">
            <button
              type="button"
              onClick={() => dispatch(decreaseQuantity(id))}
              className="flex items-center justify-center transition hover:bg-[#4F32D9]"
              aria-label="Уменьшить количество"
            >
              <Minus size={16} />
            </button>
            <div className="flex items-center justify-center text-sm font-black">
              {cartItem.quantity}
              <span className="hidden sm:inline">&nbsp;в корзине</span>
            </div>
            <button
              type="button"
              onClick={() => dispatch(increaseQuantity(id))}
              className="flex items-center justify-center transition hover:bg-[#4F32D9]"
              aria-label="Увеличить количество"
            >
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              dispatch(
                addToCart({
                  id,
                  title,
                  price,
                }),
              )
            }
            className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#6D4AFF] text-xs font-bold text-white transition hover:bg-[#4F32D9] sm:mt-4 sm:h-11 sm:gap-2 sm:rounded-2xl sm:text-sm"
          >
            <ShoppingCart size={16} className="sm:h-[18px] sm:w-[18px]" />
            В корзину
          </button>
        )}
      </div>
    </article>
  );
}
