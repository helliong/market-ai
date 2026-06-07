"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  Loader2,
  ReceiptText,
  Heart,
  Minus,
  Plus,
} from "lucide-react";
import { fetchOrder, cancelOrder, type ApiOrder } from "@/lib/order-api";
import { getCatalogProducts, type ClientProduct } from "@/lib/catalog-products";
import { getStoreSlug } from "@/lib/store-slug";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
} from "@/store/cartSlice";
import { toggleFavorite } from "@/store/favoritesSlice";

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const dispatch = useAppDispatch();
  const favoriteIds = useAppSelector((state) => state.favorites.ids);
  const cartItems = useAppSelector((state) => state.cart.items);
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchOrder(orderId)
      .then((data) => {
        if (isMounted) setOrder(data);
      })
      .catch((err) => {
        if (isMounted)
          setError(err instanceof Error ? err.message : "Ошибка загрузки");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  useEffect(() => {
    let isMounted = true;
    getCatalogProducts()
      .then((data) => {
        if (isMounted) setProducts(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-[#6D4AFF]" size={34} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8">
        <div className="rounded-2xl bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#DC2626]">
          {error || "Заказ не найден"}
        </div>
        <Link
          href="/orders"
          className="mt-4 inline-flex items-center text-sm font-bold text-[#6D4AFF]"
        >
          <ArrowLeft size={16} className="mr-2" />К списку заказов
        </Link>
      </div>
    );
  }

  const dateStr = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(new Date(order.createdAt));

  const itemsCountStr = formatItemsCount(
    order.items.reduce((acc, item) => acc + item.quantity, 0),
  );
  const grandTotalStr = formatMoney(order.grandTotal, order.currency);
  const paymentMethodLabel = "Банковская карта"; // Заглушка
  const statusLabel = getStatusLabel(order.status, order.fulfillmentStatus);

  const handleRepeatOrder = () => {
    order.items.forEach((item) => {
      dispatch(
        addToCart({
          id: item.productId,
          title: item.productTitleSnapshot,
          price: item.productPriceSnapshot,
        }),
      );
    });
  };

  const handleCancelOrder = () => {
    setIsCancelModalOpen(true);
  };

  const confirmCancelOrder = async () => {
    setIsCancelling(true);
    try {
      const updatedOrder = await cancelOrder(order.id);
      setOrder(updatedOrder);
      setIsCancelModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка отмены заказа");
    } finally {
      setIsCancelling(false);
    }
  };

  const isCancelled = order.status.toLowerCase().includes("cancel");
  const isCompleted =
    order.status.toLowerCase().includes("complete") ||
    order.fulfillmentStatus.toLowerCase().includes("received");
  const isActive = !isCancelled && !isCompleted;

  const deliveryTitle =
    order.deliveryMethod === "courier"
      ? "Курьерская доставка"
      : "Доставка в пункт выдачи";

  const paymentUrl =
    order?.payments?.[0]?.rawPayload &&
    typeof order.payments[0].rawPayload === "object" &&
    "confirmation" in order.payments[0].rawPayload
      ? (order.payments[0].rawPayload as any).confirmation?.confirmation_url
      : null;

  const addressParts = [
    order.deliveryCity,
    order.deliveryStreet,
    order.deliveryHouse,
  ];
  if (order.deliveryFlat) addressParts.push(`кв/офис ${order.deliveryFlat}`);
  const addressStr =
    addressParts.filter(Boolean).join(",") || "Адрес не указан";

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <Link
        href="/orders"
        className="inline-flex items-center text-sm font-bold text-[#6B7280] transition hover:text-[#6D4AFF]"
      >
        <ArrowLeft size={16} className="mr-2" />К списку заказов
      </Link>

      <h1 className="mt-4 text-3xl font-black text-[#111827] md:text-4xl">
        Заказ от {dateStr}
      </h1>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Левая колонка */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <section className="flex items-start gap-4 rounded-[28px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3F4F6] text-[#6B7280]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-[#111827]">
                {deliveryTitle}
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">{addressStr}</p>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-[#111827]">
              {statusLabel}
            </h2>
            {order.status.toLowerCase().includes("cancel") && order.cancellationReason && (
              <p className="mt-2 text-sm font-bold text-[#EF4444]">
                Причина отмены: {order.cancellationReason}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="rounded-2xl bg-[#F1EDFF] px-4 py-2.5 text-sm font-bold text-[#6D4AFF] transition hover:bg-[#E0D4FF]">
                Связаться с продавцом
              </button>
              <button className="rounded-2xl bg-[#F1EDFF] px-4 py-2.5 text-sm font-bold text-[#6D4AFF] transition hover:bg-[#E0D4FF]">
                Оценить товар
              </button>
              <button className="rounded-2xl bg-[#F1EDFF] px-4 py-2.5 text-sm font-bold text-[#6D4AFF] transition hover:bg-[#E0D4FF]">
                Оценить заказ
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-6">
              {order.items.map((item) => {
                const isFavorite = favoriteIds.includes(item.productId);
                const catalogProduct = products.find(
                  (p) => p.id === item.productId,
                );
                const cartItem = cartItems.find((c) => c.id === item.productId);
                const storeName = catalogProduct?.storeName || "МАГАЗИН";
                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 rounded-2xl bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] shadow-inner sm:h-24 sm:w-24"></div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link 
                        href={`/stores/${getStoreSlug(storeName)}`}
                        className="font-bold text-[#6B7280] dark:text-[#94A3B8] text-xs uppercase tracking-wider hover:text-[#6D4AFF] dark:hover:text-[#6D4AFF] transition"
                      >
                        {storeName}
                      </Link>
                      <div className="mt-1 text-lg font-black text-[#111827] dark:text-[#F9FAFB]">
                        {formatMoney(item.productPriceSnapshot, order.currency)}
                      </div>
                      <Link 
                        href={`/products/${item.productId}`}
                        className="mt-1 line-clamp-2 text-sm text-[#111827] dark:text-[#CBD5E1] transition hover:text-[#6D4AFF]"
                      >
                        {item.productTitleSnapshot}
                      </Link>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <div className="text-xs text-[#6B7280]">
                          Кол-во: {item.quantity}
                        </div>
                        <div className="flex items-center gap-2">
                          {cartItem ? (
                            <div className="flex h-9 items-center rounded-xl bg-[#F3F4F6] dark:bg-[#1E293B] p-1">
                              <button
                                onClick={() =>
                                  dispatch(decreaseQuantity(item.productId))
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-[#334155] text-[#111827] dark:text-[#F9FAFB] shadow-sm transition hover:bg-gray-50 dark:hover:bg-[#475569]"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-[#111827] dark:text-[#F9FAFB]">
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  dispatch(increaseQuantity(item.productId))
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-[#334155] text-[#111827] dark:text-[#F9FAFB] shadow-sm transition hover:bg-gray-50 dark:hover:bg-[#475569]"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                dispatch(
                                  addToCart({
                                    id: item.productId,
                                    title: item.productTitleSnapshot,
                                    price: item.productPriceSnapshot,
                                  }),
                                );
                              }}
                              className="rounded-xl bg-[#F1EDFF] dark:bg-[#201A3F] px-4 py-2 text-sm font-bold text-[#6D4AFF] dark:text-[#C4B5FD] transition hover:bg-[#E0D4FF] dark:hover:bg-[#6D4AFF]/20"
                            >
                              В корзину
                            </button>
                          )}
                          <button
                            onClick={() => dispatch(toggleFavorite(item.productId))}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${isFavorite ? 'text-[#EF4444] bg-[#FEF2F2] dark:bg-[#3F1D25]' : 'bg-[#F3F4F6] dark:bg-[#1E293B] text-[#111827] dark:text-[#F9FAFB] hover:bg-[#E5E7EB] dark:hover:bg-[#334155]'}`}
                          >
                            <Heart
                              size={18}
                              className={isFavorite ? "fill-[#EF4444]" : ""}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Правая колонка */}
        <div className="flex w-full flex-col gap-4 lg:w-[340px] xl:w-[380px]">
          <section className="rounded-[28px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-black text-[#111827]">Ваш заказ</h2>
              <span className="text-xs text-[#6B7280]">
                № {order.publicId} · {itemsCountStr}
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-[#111827]">
                <span>Товары</span>
                <span className="font-bold">{grandTotalStr}</span>
              </div>
              <div className="flex justify-between text-[#111827]">
                <span className="flex items-center gap-1">Доставка</span>
                <span className="font-bold">Без доплат</span>
              </div>
            </div>

            <hr className="my-6 border-[#E5E7EB]" />

            <div className="flex justify-between">
              <div className="flex flex-col">
                <span className="text-lg font-black text-[#111827]">
                  {order.status === "AWAITING_PAYMENT" ? "К оплате" : "Оплачено"}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {paymentMethodLabel}
                </span>
              </div>
              <span className="text-lg font-black text-[#111827]">
                {grandTotalStr}
              </span>
            </div>

            {order.status === "AWAITING_PAYMENT" && paymentUrl && (
              <a
                href={paymentUrl}
                className="mt-6 flex w-full justify-center items-center rounded-2xl bg-[#10B981] py-4 text-center text-sm font-bold text-white transition hover:bg-[#059669]"
              >
                Оплатить заказ
              </a>
            )}

            <button
              onClick={handleRepeatOrder}
              className="mt-6 w-full rounded-2xl bg-[#6D4AFF] py-4 text-center text-sm font-bold text-white transition hover:bg-[#4F32D9]"
            >
              Повторить заказ
            </button>
          </section>

          <section className="rounded-[28px] bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <button className="group flex w-full items-center justify-between rounded-2xl p-4 transition hover:bg-[#F9FAFB]">
              <div className="flex items-center gap-3 text-[#111827]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280] group-hover:bg-[#E5E7EB]">
                  <HelpCircle size={16} />
                </div>
                <span className="text-sm font-semibold">Вопросы по заказу</span>
              </div>
              <ChevronRight size={16} className="text-[#9CA3AF]" />
            </button>
            <button className="group flex w-full items-center justify-between rounded-2xl p-4 transition hover:bg-[#F9FAFB]">
              <div className="flex items-center gap-3 text-[#111827]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280] group-hover:bg-[#E5E7EB]">
                  <ReceiptText size={16} />
                </div>
                <span className="text-sm font-semibold">Чеки по заказу</span>
              </div>
              <ChevronRight size={16} className="text-[#9CA3AF]" />
            </button>
            {isCompleted && (
              <div className="mt-2 p-2">
                <button className="w-full rounded-2xl bg-[#FFF1F2] py-4 text-center text-sm font-bold text-[#E11D48] transition hover:bg-[#FFE4E6]">
                  Вернуть товары
                </button>
              </div>
            )}
            {isActive && (
              <div className="mt-2 p-2">
                <button
                  onClick={handleCancelOrder}
                  className="w-full rounded-2xl bg-[#FFF1F2] py-4 text-center text-sm font-bold text-[#E11D48] transition hover:bg-[#FFE4E6]"
                >
                  Отменить заказ
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-[#111827]">Отмена заказа</h3>
            <p className="mt-2 text-sm text-[#6B7280]">
              Вы уверены, что хотите отменить этот заказ? Это действие нельзя
              будет отменить, и вам придется оформлять его заново.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="w-full rounded-2xl bg-[#F3F4F6] py-3.5 text-sm font-bold text-[#111827] transition hover:bg-[#E5E7EB] disabled:opacity-70"
              >
                Не отменять
              </button>
              <button
                onClick={confirmCancelOrder}
                disabled={isCancelling}
                className="w-full rounded-2xl bg-[#FEF2F2] py-3.5 text-sm font-bold text-[#DC2626] transition hover:bg-[#FEE2E2] disabled:opacity-70"
              >
                {isCancelling ? "Отменяем..." : "Да, отменить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatItemsCount(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return `${count} товара`;
  return `${count} товаров`;
}

function formatMoney(value: string | number, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency}`;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusLabel(status: string, fulfillmentStatus: string) {
  const normStatus = status.toLowerCase();
  const normFulfillment = fulfillmentStatus.toLowerCase();
  if (normStatus.includes("cancel")) return "Отменен";
  if (normStatus.includes("complete") || normFulfillment.includes("received"))
    return "Получен";
  if (normStatus.includes("shipping") || normFulfillment.includes("shipped"))
    return "В пути";
  if (normStatus.includes("ready") || normFulfillment.includes("ready"))
    return "Готов к получению";
  return "В обработке";
}
