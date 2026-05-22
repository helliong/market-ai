"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearCart,
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
} from "@/store/cartSlice";

function parsePrice(price: string) {
  return Number(price.replace(/[^\d]/g, ""));
}

export function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + parsePrice(item.price) * item.quantity,
    0,
  );

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black md:text-4xl">Корзина</h1>
        <p className="mt-2 text-[#6B7280]">
          Проверьте товары перед оформлением заказа
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] bg-white p-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F1EDFF] text-[#6D4AFF]">
            <ShoppingBag size={38} />
          </div>

          <h2 className="mt-6 text-2xl font-black">Корзина пустая</h2>
          <p className="mt-3 max-w-[420px] text-[#6B7280]">
            Добавьте товары из каталога, чтобы оформить заказ.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-[84px_1fr] gap-4 rounded-[24px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:grid-cols-[112px_1fr_auto] sm:items-center sm:gap-5 sm:rounded-[28px] sm:p-5"
              >
                <Link
                  href={`/products/${item.id}`}
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF] sm:h-28 sm:w-28 sm:rounded-[24px]"
                >
                  <div className="h-10 w-14 rounded-xl bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] sm:h-14 sm:w-20 sm:rounded-2xl" />
                </Link>

                <div className="min-w-0">
                  <Link
                    href={`/products/${item.id}`}
                    className="line-clamp-2 text-sm font-black text-[#111827] transition hover:text-[#6D4AFF] sm:text-lg"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-[#6B7280] sm:mt-2 sm:text-sm">
                    Доставка доступна в выбранный город
                  </p>

                  <div className="mt-3 flex items-center gap-2 sm:mt-4 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => dispatch(decreaseQuantity(item.id))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6F7FB] text-[#6B7280] transition hover:bg-[#F1EDFF] hover:text-[#6D4AFF]"
                      aria-label="Уменьшить количество"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="min-w-6 text-center font-bold">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => dispatch(increaseQuantity(item.id))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6F7FB] text-[#6D4AFF] transition hover:bg-[#F1EDFF]"
                      aria-label="Увеличить количество"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-between gap-3 border-t border-[#E5E7EB] pt-4 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                  <p className="text-xl font-black sm:text-2xl">{item.price}</p>

                  <button
                    type="button"
                    onClick={() => dispatch(removeFromCart(item.id))}
                    className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-[#EF4444] transition hover:bg-[#FEF2F2] sm:mt-5 sm:px-4"
                  >
                    <Trash2 size={16} />
                    Удалить
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black">Итого</h2>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between text-[#6B7280]">
                <span>Товары</span>
                <span>{itemsCount}</span>
              </div>

              <div className="flex justify-between text-[#6B7280]">
                <span>Доставка</span>
                <span>Бесплатно</span>
              </div>

              <div className="h-px bg-[#E5E7EB]" />

              <div className="flex justify-between text-xl font-black">
                <span>К оплате</span>
                <span>{total.toLocaleString("ru-RU")} ₽</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[#6D4AFF] text-base font-bold text-white transition hover:bg-[#4F32D9]"
            >
              Оформить заказ
            </Link>

            <button
              type="button"
              onClick={() => dispatch(clearCart())}
              className="mt-3 h-12 w-full rounded-2xl bg-[#F6F7FB] text-sm font-bold text-[#6B7280] transition hover:bg-[#FEF2F2] hover:text-[#EF4444]"
            >
              Очистить корзину
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
