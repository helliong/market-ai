"use client";

import Link from "next/link";
import { Scale, ShoppingCart, Trash2 } from "lucide-react";
import { products } from "@/data/products";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleCompare } from "@/store/compareSlice";
import { addToCart } from "@/store/cartSlice";

export function ComparePage() {
  const dispatch = useAppDispatch();
  const compareIds = useAppSelector((state) => state.compare.ids);

  const compareProducts = products.filter((product) =>
    compareIds.includes(product.id)
  );

  return (
    <section className="mx-auto max-w-[1440px] px-8 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-[-0.04em]">
            Сравнение товаров
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Сравните товары по цене, рейтингу и отзывам
          </p>
        </div>

        <Link
          href="/"
          className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#6D4AFF] shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#F1EDFF]"
        >
          Продолжить покупки
        </Link>
      </div>

      {compareProducts.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] bg-white p-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F1EDFF] text-[#6D4AFF]">
            <Scale size={38} />
          </div>

          <h2 className="mt-6 text-2xl font-black">Список сравнения пуст</h2>
          <p className="mt-3 max-w-[420px] text-[#6B7280]">
            Добавьте товары в сравнение, чтобы выбрать лучший вариант.
          </p>

          <Link
            href="/"
            className="mt-6 rounded-2xl bg-[#6D4AFF] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#4F32D9]"
          >
            На главную
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="grid" style={{ gridTemplateColumns: `220px repeat(${compareProducts.length}, 1fr)` }}>
            <div className="border-b border-[#E5E7EB] bg-[#F6F7FB] p-5 font-bold">
              Товар
            </div>

            {compareProducts.map((product) => (
              <div key={product.id} className="border-b border-[#E5E7EB] p-5">
                <div className="h-36 rounded-[24px] bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF]" />

                <h3 className="mt-4 min-h-[44px] text-sm font-black">
                  {product.title}
                </h3>

                <p className="mt-3 text-2xl font-black">{product.price}</p>

                <div className="mt-4 flex gap-2">
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
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#6D4AFF] text-xs font-bold text-white"
                  >
                    <ShoppingCart size={16} />
                    В корзину
                  </button>

                  <button
                    onClick={() => dispatch(toggleCompare(product.id))}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#EF4444]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            <CompareRow label="Рейтинг" values={compareProducts.map((p) => String(p.rating))} />
            <CompareRow label="Отзывы" values={compareProducts.map((p) => `${p.reviews} отзывов`)} />
            <CompareRow label="Старая цена" values={compareProducts.map((p) => p.oldPrice || "—")} />
            <CompareRow label="Статус" values={compareProducts.map((p) => p.badge || "—")} />
            <CompareRow label="Доставка" values={compareProducts.map(() => "Доступна")} />
          </div>
        </div>
      )}
    </section>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <>
      <div className="border-b border-[#E5E7EB] bg-[#F6F7FB] p-5 text-sm font-bold">
        {label}
      </div>

      {values.map((value, index) => (
        <div
          key={`${label}-${index}`}
          className="border-b border-[#E5E7EB] p-5 text-sm font-semibold"
        >
          {value}
        </div>
      ))}
    </>
  );
}