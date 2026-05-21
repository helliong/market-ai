"use client";

import Link from "next/link";
import { Heart, Minus, Plus, Scale, ShoppingCart, Star } from "lucide-react";
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
};

export function ProductCard({
  id,
  title,
  price,
  oldPrice,
  rating,
  reviews,
  badge,
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
    <article className="group relative rounded-[24px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(109,74,255,0.14)]">
      {badge && (
        <span className="absolute left-4 top-4 z-10 rounded-full bg-[#F1EDFF] px-3 py-1 text-xs font-bold text-[#6D4AFF]">
          {badge}
        </span>
      )}

      <div className="absolute right-4 top-4 z-10 flex gap-2">
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
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:text-[#6D4AFF] disabled:opacity-50 ${
            isCompared ? "text-[#6D4AFF]" : "text-[#6B7280]"
          }`}
        >
          <Scale size={18} />
        </button>

        <button
          type="button"
          onClick={() => dispatch(toggleFavorite(id))}
          aria-label="Добавить в избранное"
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:text-[#EF4444] ${
            isFavorite ? "text-[#EF4444]" : "text-[#6B7280]"
          }`}
        >
          <Heart
            size={18}
            className={isFavorite ? "fill-[#EF4444]" : undefined}
          />
        </button>
      </div>

      <Link
        href={`/products/${id}`}
        className="flex h-[190px] items-center justify-center rounded-[20px] bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF]"
      >
        <div className="h-24 w-32 rounded-[22px] bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] shadow-[0_18px_40px_rgba(79,50,217,0.22)] transition group-hover:scale-105" />
      </Link>

      <div className="mt-4">
        <Link
          href={`/products/${id}`}
          className="line-clamp-2 min-h-[44px] text-[15px] font-bold leading-[1.45] text-[#111827] transition hover:text-[#6D4AFF]"
        >
          {title}
        </Link>

        <div className="mt-3 flex items-center gap-1 text-sm">
          <Star size={16} className="fill-[#F59E0B] text-[#F59E0B]" />
          <span className="font-bold">{rating}</span>
          <span className="text-[#6B7280]">• {reviews} отзывов</span>
        </div>

        <div className="mt-4 flex items-end gap-2">
          <span className="text-2xl font-black tracking-[-0.03em]">
            {price}
          </span>

          {oldPrice && (
            <span className="mb-1 text-sm text-[#9CA3AF] line-through">
              {oldPrice}
            </span>
          )}
        </div>

        {cartItem ? (
          <div className="mt-4 grid h-11 grid-cols-[44px_1fr_44px] overflow-hidden rounded-2xl bg-[#6D4AFF] text-white">
            <button
              type="button"
              onClick={() => dispatch(decreaseQuantity(id))}
              className="flex items-center justify-center transition hover:bg-[#4F32D9]"
              aria-label="Уменьшить количество"
            >
              <Minus size={17} />
            </button>
            <div className="flex items-center justify-center text-sm font-black">
              {cartItem.quantity} в корзине
            </div>
            <button
              type="button"
              onClick={() => dispatch(increaseQuantity(id))}
              className="flex items-center justify-center transition hover:bg-[#4F32D9]"
              aria-label="Увеличить количество"
            >
              <Plus size={17} />
            </button>
          </div>
        ) : (
          <button
            onClick={() =>
              dispatch(
                addToCart({
                  id,
                  title,
                  price,
                }),
              )
            }
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#6D4AFF] text-sm font-bold text-white transition hover:bg-[#4F32D9]"
          >
            <ShoppingCart size={18} />В корзину
          </button>
        )}
      </div>
    </article>
  );
}
