"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  removeFromCart,
  clearCart,
  increaseQuantity,
  decreaseQuantity,
} from "@/store/cartSlice";

function parsePrice(price: string) {
  return Number(price.replace(/[^\d]/g, ""));
}

export function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);

  const total = items.reduce(
    (sum, item) => sum + parsePrice(item.price) * item.quantity,
    0,
  );

  return (
    <section className="mx-auto max-w-[1440px] px-8 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-[-0.04em]">Корзина</h1>
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
        <div className="grid grid-cols-[1fr_380px] gap-8">
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex items-center gap-5 rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
              >
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF]">
                  <div className="h-14 w-20 rounded-2xl bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9]" />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#6B7280]">
                    Доставка доступна в выбранный город
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => dispatch(decreaseQuantity(item.id))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6F7FB] text-[#6B7280] transition hover:bg-[#F1EDFF] hover:text-[#6D4AFF]"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="min-w-6 text-center font-bold">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => dispatch(increaseQuantity(item.id))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6F7FB] text-[#6D4AFF] transition hover:bg-[#F1EDFF]"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black">{item.price}</p>

                  <button
                    onClick={() => dispatch(removeFromCart(item.id))}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-[#EF4444] transition hover:bg-[#FEF2F2]"
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
                <span>{items.length}</span>
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

            <button className="mt-6 h-14 w-full rounded-2xl bg-[#6D4AFF] text-base font-bold text-white transition hover:bg-[#4F32D9]">
              Оформить заказ
            </button>

            <button
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
