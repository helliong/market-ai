"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import { removeFromCartLocal } from "@/store/cartSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { createCheckoutOrder } from "@/lib/order-api";
import { removeServerCartItem } from "@/lib/shopping-api";
import { addActiveOrder } from "@/store/ordersSlice";
import type { CartItem } from "@/store/cartSlice";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { getMainProductImageUrl } from "@/lib/product-image";

const PENDING_ORDER_STORAGE_KEY = "marketai-pending-order";

type PendingPaidOrder = {
  orderId: string;
  items: CartItem[];
  total: string;
  createdAt: string;
};

// Преобразует цену из строки в число для расчета суммы заказа.
function parsePrice(price: string) {
  return Number(price.replace(/[^\d]/g, ""));
}

// Форматирует ввод телефона в привычный вид российского номера.
function formatRussianPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("7") || digits.startsWith("8"))
    digits = digits.slice(1);
  const localDigits = digits.slice(0, 10);
  const parts = [
    localDigits.slice(0, 3),
    localDigits.slice(3, 6),
    localDigits.slice(6, 8),
    localDigits.slice(8, 10),
  ];
  if (!localDigits) return "";
  let phone = `+7 (${parts[0]})`;
  if (parts[1]) phone += ` ${parts[1]}`;
  if (parts[2]) phone += `-${parts[2]}`;
  if (parts[3]) phone += `-${parts[3]}`;
  return phone;
}

// Экран оформления заказа собирает контакты, адрес, способ доставки и оплату.
export function CheckoutPage() {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const items = useAppSelector((state) => state.cart.items);
  const user = useAppSelector((state) => state.auth.user);
  const products = useCatalogProducts();
  const isSessionRestored = useAppSelector(
    (state) => state.auth.isSessionRestored,
  );
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("courier");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const paymentReturn = searchParams.get("payment") === "return";
  const selectedIds = searchParams
    .get("items")
    ?.split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
  const checkoutItems = selectedIds?.length
    ? items.filter((item) => selectedIds.includes(item.id))
    : items;
  const itemsCount = checkoutItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const total = checkoutItems.reduce(
    (sum, item) => sum + parsePrice(item.price) * item.quantity,
    0,
  );
  const productImageById = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          getMainProductImageUrl(product.images),
        ]),
      ),
    [products],
  );

  useEffect(() => {
    setPhone(formatRussianPhone(user?.phone ?? ""));
  }, [user?.phone]);

  useEffect(() => {
    if (!paymentReturn || !isSessionRestored) {
      return;
    }

    setIsOrderPlaced(true);
    const pendingOrder = readPendingOrder();

    if (!pendingOrder) {
      return;
    }

    dispatch(
      addActiveOrder({
        id: pendingOrder.orderId.slice(0, 8).toUpperCase(),
        serverOrderId: pendingOrder.orderId,
        date: formatOrderDate(pendingOrder.createdAt),
        title: buildOrderTitle(pendingOrder.items),
        itemsCount: pendingOrder.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        ),
        total: pendingOrder.total,
        status: "processing",
        statusLabel: "Заказ принят",
        details:
          "Мы уже передали заказ продавцу и обновим статус, когда он будет готов к отправке.",
        items: pendingOrder.items,
      }),
    );

    pendingOrder.items.forEach((item) => {
      dispatch(removeFromCartLocal(item.id));
      void removeServerCartItem(item.id).catch(() => undefined);
    });
    clearPendingOrder();
  }, [dispatch, isSessionRestored, paymentReturn]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      const formData = new FormData(event.currentTarget);
      const returnUrl = `${window.location.origin}/checkout?payment=return`;
      const result = await createCheckoutOrder({
        items: checkoutItems.map((item) => ({
          productId: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        customer: {
          name: String(formData.get("name") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? ""),
        },
        delivery: {
          city: String(formData.get("city") ?? ""),
          street: String(formData.get("street") ?? ""),
          house: String(formData.get("house") ?? ""),
          flat: String(formData.get("flat") ?? ""),
          comment: String(formData.get("comment") ?? ""),
          method: String(formData.get("delivery") ?? "courier"),
        },
        payment: {
          method: String(formData.get("payment") ?? "card"),
        },
        returnUrl,
      });

      if (!result.confirmationUrl) {
        throw new Error("Payment link was not returned");
      }

      writePendingOrder({
        orderId: result.orderId,
        items: checkoutItems,
        total: `${total.toLocaleString("ru-RU")} ₽`,
        createdAt: new Date().toISOString(),
      });

      window.location.href = result.confirmationUrl;
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to create payment",
      );
      setIsSubmitting(false);
    }
  }

  if (isOrderPlaced) {
    return (
      <section className="mx-auto max-w-[960px] px-4 py-10 md:px-8 md:py-14">
        <div className="flex min-h-[480px] flex-col items-center justify-center rounded-[32px] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#10B981] text-white">
            <CheckCircle2 size={42} />
          </div>
          <h1 className="mt-6 text-3xl font-black md:text-4xl">
            {t("orderPlaced")}
          </h1>
          <p className="mt-3 max-w-[520px] text-[#6B7280]">
            {t("orderPlacedMessage")}
          </p>
          <Link
            href="/catalog"
            className="mt-7 flex h-12 items-center justify-center rounded-2xl bg-[#6D4AFF] px-6 text-sm font-bold text-white transition hover:bg-[#4F32D9]"
          >
            {t("backToCatalog")}
          </Link>
        </div>
      </section>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <section className="mx-auto max-w-[960px] px-4 py-10 md:px-8 md:py-14">
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F1EDFF] text-[#6D4AFF]">
            <ShoppingBag size={38} />
          </div>
          <h1 className="mt-6 text-3xl font-black">{t("emptyCart")}</h1>
          <p className="mt-3 max-w-[420px] text-[#6B7280]">
            Добавьте товары, чтобы перейти к оформлению заказа.
          </p>
          <Link
            href="/catalog"
            className="mt-7 flex h-12 items-center justify-center rounded-2xl bg-[#6D4AFF] px-6 text-sm font-bold text-white transition hover:bg-[#4F32D9]"
          >
            {t("backToCatalog")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <Link
        href="/cart"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#6D4AFF] transition hover:text-[#4F32D9]"
      >
        <ChevronLeft size={18} /> {t("backToCart")}
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-black md:text-4xl">
          {t("checkoutTitle")}
        </h1>
        <p className="mt-2 text-[#6B7280]">{t("checkoutSubtitle")}</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px] lg:gap-8"
      >
        <div className="space-y-6">
          <CheckoutBlock
            icon={<User size={24} />}
            title={t("recipient")}
            description={t("recipientDesc")}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label={t("name")}
                name="name"
                placeholder="Иван"
                defaultValue={user?.name || ""}
              />
              <TextField
                label="Телефон"
                name="phone"
                placeholder="+7 (900) 000-00-00"
                type="tel"
                value={phone}
                onChange={(value: string) =>
                  setPhone(formatRussianPhone(value))
                }
                inputMode="numeric"
                autoComplete="tel"
                minLength={18}
                maxLength={18}
              />
              <TextField
                label="Email"
                name="email"
                placeholder="mail@example.com"
                type="email"
                defaultValue={user?.email || ""}
                className="md:col-span-2"
              />
            </div>
          </CheckoutBlock>
          <CheckoutBlock
            icon={<Truck size={24} />}
            title={t("deliveryMethod")}
            description={t("deliveryMethodDesc")}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <RadioCard
                name="delivery"
                value="courier"
                title={t("courier")}
                description="Доставка завтра, бесплатно"
                checked={deliveryMethod === "courier"}
                onChange={() => setDeliveryMethod("courier")}
              />
              <RadioCard
                name="delivery"
                value="pickup"
                title={t("pickup")}
                description={t("pickupDesc")}
                disabledReason="Самовывоз временно недоступен: подключаем пункты выдачи в вашем городе"
              />
            </div>
          </CheckoutBlock>
          {deliveryMethod === "courier" && (
            <CheckoutBlock
              icon={<MapPin size={24} />}
              title={t("address")}
              description={t("addressDesc")}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label={t("city")}
                  name="city"
                  defaultValue={user?.deliveryCity || "Екатеринбург"}
                />
                <TextField
                  label={t("street")}
                  name="street"
                  placeholder="Ленина"
                  defaultValue={user?.deliveryStreet || ""}
                />
                <TextField
                  label={t("house")}
                  name="house"
                  placeholder="10"
                  defaultValue={user?.deliveryHouse || ""}
                />
                <TextField
                  label={t("apartment")}
                  name="flat"
                  placeholder="24"
                  defaultValue={user?.deliveryFlat || ""}
                />
                <label className="md:col-span-2">
                  <span className="text-sm font-bold text-[#111827]">
                    {t("comment")}
                  </span>
                  <textarea
                    name="comment"
                    rows={4}
                    placeholder={t("commentPlaceholder")}
                    defaultValue={user?.deliveryComment || ""}
                    className="mt-2 w-full resize-none rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#6D4AFF] focus:bg-white"
                  />
                </label>
              </div>
            </CheckoutBlock>
          )}
          <CheckoutBlock
            icon={<CreditCard size={24} />}
            title={t("payment")}
            description={t("paymentDesc")}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <RadioCard
                name="payment"
                value="card"
                title="Картой онлайн"
                description="Оплата через защищенную платежную страницу"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
              />
              <RadioCard
                name="payment"
                value="cash"
                title="Оплата при получении"
                description="Картой или наличными курьеру"
                disabledReason="Станет доступна после подключения касс у курьеров"
              />
            </div>
          </CheckoutBlock>
        </div>
        <aside className="h-fit rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] lg:sticky lg:top-[100px]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF]">
              <PackageCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black">{t("yourOrder")}</h2>
              <p className="text-sm text-[#6B7280]">
                {itemsCount} {t("items")}
              </p>
            </div>
          </div>
          <div className="mt-6 max-h-[300px] space-y-4 overflow-y-auto pr-1">
            {checkoutItems.map((item) => {
              const imageUrl = item.imageUrl ?? productImageById.get(item.id);

              return (
              <div key={item.id} className="flex gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF]">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="h-full w-full object-contain p-1.5"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-8 w-10 rounded-xl bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold">{item.title}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {item.quantity} шт. × {item.price}
                  </p>
                </div>
              </div>
              );
            })}
          </div>
          <div className="mt-6 space-y-4 border-t border-[#E5E7EB] pt-5 text-sm">
            <div className="flex justify-between text-[#6B7280]">
              <span>{t("items")}</span>
              <span>{total.toLocaleString("ru-RU")} ₽</span>
            </div>
            <div className="flex justify-between text-[#6B7280]">
              <span>{t("deliveryCost")}</span>
              <span>Завтра, бесплатно</span>
            </div>
            <div className="flex justify-between text-xl font-black">
              <span>{t("toPay")}</span>
              <span>{total.toLocaleString("ru-RU")} ₽</span>
            </div>
          </div>
          {submitError && (
            <p className="mt-4 rounded-2xl bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#DC2626]">
              {submitError}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 h-14 w-full rounded-2xl bg-[#6D4AFF] text-base font-bold text-white transition hover:bg-[#4F32D9] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Создаем платеж..." : t("confirmOrder")}
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-[#6B7280]">
            {t("orderConfirmationNote")}
          </p>
        </aside>
      </form>
    </section>
  );
}

function readPendingOrder() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.sessionStorage.getItem(
      PENDING_ORDER_STORAGE_KEY,
    );

    if (!storedValue) {
      return null;
    }

    return JSON.parse(storedValue) as PendingPaidOrder;
  } catch {
    return null;
  }
}

function writePendingOrder(order: PendingPaidOrder) {
  window.sessionStorage.setItem(
    PENDING_ORDER_STORAGE_KEY,
    JSON.stringify(order),
  );
}

function clearPendingOrder() {
  window.sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
}

function buildOrderTitle(items: CartItem[]) {
  if (items.length === 1) {
    return items[0].title;
  }

  return `${items[0].title} и еще ${items.length - 1}`;
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

// Секция формы оформления с иконкой, заголовком и описанием.
function CheckoutBlock({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF]">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-black">{title}</h2>
          <p className="text-sm text-[#6B7280]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

// Универсальное текстовое поле оформления заказа с подписью и дополнительным описанием.
function TextField({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
  value,
  onChange,
  inputMode,
  autoComplete,
  minLength,
  maxLength,
  className = "",
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        inputMode={inputMode}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={maxLength}
        required={name !== "flat"}
        className="mt-2 h-12 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm outline-none transition focus:border-[#6D4AFF] focus:bg-white"
      />
    </label>
  );
}

// Карточка radio-выбора для доставки или оплаты.
function RadioCard({
  name,
  value,
  title,
  description,
  checked,
  onChange,
  disabledReason,
}: {
  name: string;
  value: string;
  title: string;
  description: string;
  checked?: boolean;
  onChange?: () => void;
  disabledReason?: string;
}) {
  const isDisabled = Boolean(disabledReason);

  return (
    <label
      className={`flex min-h-[108px] gap-3 rounded-2xl border p-4 transition ${
        isDisabled
          ? "cursor-not-allowed border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]"
          : "cursor-pointer border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#6D4AFF] hover:bg-white"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={isDisabled}
        className="mt-1 h-4 w-4 accent-[#6D4AFF]"
      />
      <span>
        <span className="block font-black">{title}</span>
        <span className="mt-1 block text-sm text-[#6B7280]">{description}</span>
        {disabledReason && (
          <span className="mt-2 block text-xs font-bold text-[#EF4444]">
            {disabledReason}
          </span>
        )}
      </span>
    </label>
  );
}
