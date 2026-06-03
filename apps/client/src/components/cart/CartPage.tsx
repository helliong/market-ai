"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Heart, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearCart,
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
} from "@/store/cartSlice";
import { toggleFavorite } from "@/store/favoritesSlice";
import { useLanguage } from "@/hooks/useLanguage";

function parsePrice(price: string) {
  return Number(price.replace(/[^\d]/g, ""));
}

export function CartPage() {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const user = useAppSelector((state) => state.auth.user);
  const favoriteIds = useAppSelector((state) => state.favorites.ids);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const knownItemIdsRef = useRef<number[]>([]);

  useEffect(() => {
    const itemIds = items.map((item) => item.id);
    const knownItemIds = knownItemIdsRef.current;
    const newItemIds = itemIds.filter((id) => !knownItemIds.includes(id));

    setSelectedIds((current) => {
      const keptIds = current.filter((id) => itemIds.includes(id));
      return [...keptIds, ...newItemIds];
    });

    knownItemIdsRef.current = itemIds;
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  const itemsCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = selectedItems.reduce(
    (sum, item) => sum + parsePrice(item.price) * item.quantity,
    0,
  );
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const hasSelectedItems = selectedItems.length > 0;
  const selectedQuery = selectedIds.join(",");
  const checkoutPath = selectedQuery ? `/checkout?items=${selectedQuery}` : "/checkout";
  const checkoutHref = user
    ? checkoutPath
    : `/register?redirect=${encodeURIComponent(checkoutPath)}`;

  function toggleItem(productId: number) {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  function toggleAllItems() {
    setSelectedIds(isAllSelected ? [] : items.map((item) => item.id));
  }

  function decreaseSelectedItem(productId: number) {
    setSelectedIds((current) =>
      current.includes(productId) ? current : [...current, productId],
    );
    dispatch(decreaseQuantity(productId));
  }

  function increaseSelectedItem(productId: number) {
    setSelectedIds((current) =>
      current.includes(productId) ? current : [...current, productId],
    );
    dispatch(increaseQuantity(productId));
  }

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black md:text-4xl">{t("cartTitle")}</h1>
        <p className="mt-2 text-[#6B7280]">{t("cartSubtitle")}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] bg-white p-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F1EDFF] text-[#6D4AFF]">
            <ShoppingBag size={38} />
          </div>
          <h2 className="mt-6 text-2xl font-black">{t("emptyCart")}</h2>
          <p className="mt-3 max-w-[420px] text-[#6B7280]">{t("emptyCartMessage")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[24px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={toggleAllItems}
                className="inline-flex items-center gap-3 text-left text-sm font-black text-[#111827] transition hover:text-[#6D4AFF]"
              >
                <SelectionBox checked={isAllSelected} />
                Выбрать все
              </button>
              <p className="text-sm font-semibold text-[#6B7280]">
                Выбрано: {selectedItems.length} из {items.length}
              </p>
            </div>

            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isFavorite = favoriteIds.includes(item.id);

              return (
                <article
                  key={item.id}
                  className={`grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3 rounded-[24px] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition sm:grid-cols-[104px_minmax(0,1fr)_116px] sm:gap-4 sm:rounded-[28px] sm:p-4 ${
                    isSelected ? "ring-1 ring-[#6D4AFF]/20" : ""
                  }`}
                >
                  <Link
                    href={`/products/${item.id}`}
                    className="relative flex aspect-[3/4] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF] sm:w-[96px] sm:rounded-[22px]"
                  >
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        toggleItem(item.id);
                      }}
                      className="absolute left-2 top-2 z-10"
                      aria-label={
                        isSelected
                          ? "Убрать товар из оформления"
                          : "Выбрать товар для оформления"
                      }
                    >
                      <SelectionBox checked={isSelected} />
                    </button>
                    <div className="h-[88px] w-[52px] rounded-[18px] bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] shadow-[0_16px_32px_rgba(79,50,217,0.20)] sm:h-[120px] sm:w-[72px] sm:rounded-[22px]" />
                  </Link>

                  <div className="min-w-0 self-center">
                    <Link
                      href={`/products/${item.id}`}
                      className="line-clamp-2 text-sm font-black leading-5 text-[#111827] transition hover:text-[#6D4AFF] sm:text-base"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-2 text-xs font-semibold text-[#6B7280]">
                      {t("deliveryAvailable")}
                    </p>
                    <button
                      type="button"
                      onClick={() => dispatch(removeFromCart(item.id))}
                      className="mt-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6F7FB] text-[#EF4444] transition hover:bg-[#FEF2F2]"
                      aria-label="Удалить товар"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch(toggleFavorite(item.id))}
                      className={`ml-2 mt-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6F7FB] transition hover:bg-[#FCE7F3] hover:text-[#EF4444] ${
                        isFavorite ? "text-[#EF4444]" : "text-[#6B7280]"
                      }`}
                      aria-label={
                        isFavorite ? "Убрать из избранного" : "Добавить в избранное"
                      }
                    >
                      <Heart
                        size={16}
                        className={isFavorite ? "fill-[#EF4444]" : ""}
                      />
                    </button>
                  </div>

                  <div className="col-span-2 flex items-center justify-between gap-3 border-t border-[#E5E7EB] pt-3 sm:col-span-1 sm:flex-col sm:items-stretch sm:justify-center sm:border-t-0 sm:pt-0">
                    <p className="text-lg font-black text-[#111827] sm:text-xl">
                      {item.price}
                    </p>
                    <div className="grid h-10 w-[132px] grid-cols-[40px_1fr_40px] overflow-hidden rounded-2xl bg-[#F6F7FB] text-[#111827] sm:w-full">
                      <button
                        type="button"
                        onClick={() => decreaseSelectedItem(item.id)}
                        className="flex items-center justify-center text-[#111827] transition hover:bg-[#F1EDFF] hover:text-[#6D4AFF]"
                        aria-label={t("decreaseQuantity")}
                      >
                        <Minus size={17} strokeWidth={3} />
                      </button>
                      <span className="flex items-center justify-center text-sm font-black">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => increaseSelectedItem(item.id)}
                        className="flex items-center justify-center text-[#6D4AFF] transition hover:bg-[#F1EDFF]"
                        aria-label={t("increaseQuantity")}
                      >
                        <Plus size={17} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black">{t("total")}</h2>
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between text-[#6B7280]">
                <span>{t("items")}</span>
                <span>{itemsCount}</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Выбрано товаров</span>
                <span>{selectedItems.length}</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>{t("deliveryCost")}</span>
                <span>{t("free")}</span>
              </div>
              <div className="h-px bg-[#E5E7EB]" />
              <div className="flex justify-between text-xl font-black">
                <span>{t("toPay")}</span>
                <span>{total.toLocaleString("ru-RU")} ₽</span>
              </div>
            </div>

            {hasSelectedItems ? (
              <Link
                href={checkoutHref}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[#6D4AFF] text-base font-bold text-white transition hover:bg-[#4F32D9]"
              >
                Оформить выбранное
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="mt-6 h-14 w-full rounded-2xl bg-[#E5E7EB] text-base font-bold text-[#9CA3AF]"
              >
                Выберите товары
              </button>
            )}

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

function SelectionBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 outline outline-2 outline-white transition ${
        checked
          ? "border-[#6D4AFF] bg-[#6D4AFF] text-white"
          : "border-[#D1D5DB] bg-white text-transparent"
      }`}
    >
      <Check size={15} strokeWidth={3} />
    </span>
  );
}
