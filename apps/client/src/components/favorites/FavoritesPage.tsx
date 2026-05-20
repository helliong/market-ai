"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { products } from "@/data/products";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCart } from "@/store/cartSlice";
import { toggleFavorite } from "@/store/favoritesSlice";

export function FavoritesPage() {
  const dispatch = useAppDispatch();
  const favoriteIds = useAppSelector((state) => state.favorites.ids);

  const favoriteProducts = products.filter((product) =>
    favoriteIds.includes(product.id)
  );

  return (
    <section className="mx-auto max-w-[1440px] px-8 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-[-0.04em]">
            Избранное
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Товары, которые вы сохранили для покупки позже
          </p>
        </div>

        <Link
          href="/"
          className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#6D4AFF] shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#F1EDFF]"
        >
          Продолжить покупки
        </Link>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] bg-white p-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F1EDFF] text-[#6D4AFF]">
            <Heart size={38} />
          </div>

          <h2 className="mt-6 text-2xl font-black">Избранное пустое</h2>
          <p className="mt-3 max-w-[420px] text-[#6B7280]">
            Нажмите на сердечко в карточке товара, чтобы сохранить товар здесь.
          </p>

          <Link
            href="/"
            className="mt-6 rounded-2xl bg-[#6D4AFF] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#4F32D9]"
          >
            На главную
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-5">
          {favoriteProducts.map((product) => (
            <article
              key={product.id}
              className="group relative rounded-[24px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(109,74,255,0.14)]"
            >
              <button
                onClick={() => dispatch(toggleFavorite(product.id))}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#EF4444] shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:bg-[#FEF2F2]"
              >
                <Trash2 size={17} />
              </button>

              <div className="flex h-[190px] items-center justify-center rounded-[20px] bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF]">
                <div className="h-24 w-32 rounded-[22px] bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] shadow-[0_18px_40px_rgba(79,50,217,0.22)] transition group-hover:scale-105" />
              </div>

              <div className="mt-4">
                <h3 className="line-clamp-2 min-h-[44px] text-[15px] font-bold leading-[1.45] text-[#111827]">
                  {product.title}
                </h3>

                <div className="mt-4 flex items-end gap-2">
                  <span className="text-2xl font-black tracking-[-0.03em]">
                    {product.price}
                  </span>

                  {product.oldPrice && (
                    <span className="mb-1 text-sm text-[#9CA3AF] line-through">
                      {product.oldPrice}
                    </span>
                  )}
                </div>

                <button
                  onClick={() =>
                    dispatch(
                      addToCart({
                        id: product.id,
                        title: product.title,
                        price: product.price,
                      })
                    )
                  }
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#6D4AFF] text-sm font-bold text-white transition hover:bg-[#4F32D9]"
                >
                  <ShoppingCart size={18} />В корзину
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}