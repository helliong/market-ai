"use client";

import { Heart, ShoppingCart, Star } from "lucide-react";
import { addToCart } from "@/store/cartSlice";
import { toggleFavorite } from "@/store/favoritesSlice";
import { useAppDispatch } from "@/store/hooks";

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

  return (
    <article className="group relative rounded-[24px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(109,74,255,0.14)]">
      {badge && (
        <span className="absolute left-4 top-4 z-10 rounded-full bg-[#F1EDFF] px-3 py-1 text-xs font-bold text-[#6D4AFF]">
          {badge}
        </span>
      )}

      <button
        onClick={() => dispatch(toggleFavorite(id))}
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#6B7280] shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:text-[#EF4444]"
      >
        <Heart size={18} />
      </button>

      <div className="flex h-[190px] items-center justify-center rounded-[20px] bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF]">
        <div className="h-24 w-32 rounded-[22px] bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] shadow-[0_18px_40px_rgba(79,50,217,0.22)] transition group-hover:scale-105" />
      </div>

      <div className="mt-4">
        <h3 className="line-clamp-2 min-h-[44px] text-[15px] font-bold leading-[1.45] text-[#111827]">
          {title}
        </h3>

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

        <button
          onClick={() =>
            dispatch(
              addToCart({
                id: Date.now(),
                title,
                price,
              }),
            )
          }
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#6D4AFF] text-sm font-bold text-white transition hover:bg-[#4F32D9]"
        >
          <ShoppingCart size={18} />В корзину
        </button>
      </div>
    </article>
  );
}
