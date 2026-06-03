"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronLeft, CreditCard, MapPin, PackageCheck, ShoppingBag, Truck, User } from "lucide-react";
import { clearCart, removeFromCart } from "@/store/cartSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useLanguage } from "@/hooks/useLanguage";

// Преобразует цену из строки в число для расчета суммы заказа.
function parsePrice(price: string) { return Number(price.replace(/[^\d]/g, "")); }

// Форматирует ввод телефона в привычный вид российского номера.
function formatRussianPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("7") || digits.startsWith("8")) digits = digits.slice(1);
  const localDigits = digits.slice(0, 10);
  const parts = [localDigits.slice(0,3), localDigits.slice(3,6), localDigits.slice(6,8), localDigits.slice(8,10)];
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
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [phone, setPhone] = useState("");
  const selectedIds = searchParams
    .get("items")
    ?.split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
  const checkoutItems = selectedIds?.length
    ? items.filter((item) => selectedIds.includes(item.id))
    : items;
  const itemsCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = checkoutItems.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsOrderPlaced(true);
    if (selectedIds?.length) {
      checkoutItems.forEach((item) => {
        dispatch(removeFromCart(item.id));
      });
    } else {
      dispatch(clearCart());
    }
  }

  if (isOrderPlaced) {
    return (
      <section className="mx-auto max-w-[960px] px-4 py-10 md:px-8 md:py-14">
        <div className="flex min-h-[480px] flex-col items-center justify-center rounded-[32px] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] dark:bg-[#10B981] text-white"><CheckCircle2 size={42} /></div>
          <h1 className="mt-6 text-3xl font-black md:text-4xl">{t("orderPlaced")}</h1>
          <p className="mt-3 max-w-[520px] text-[#6B7280]">{t("orderPlacedMessage")}</p>
          <Link href="/catalog" className="mt-7 flex h-12 items-center justify-center rounded-2xl bg-[#6D4AFF] px-6 text-sm font-bold text-white transition hover:bg-[#4F32D9]">{t("backToCatalog")}</Link>
        </div>
      </section>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <section className="mx-auto max-w-[960px] px-4 py-10 md:px-8 md:py-14">
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F1EDFF] text-[#6D4AFF]"><ShoppingBag size={38} /></div>
          <h1 className="mt-6 text-3xl font-black">{t("emptyCart")}</h1>
          <p className="mt-3 max-w-[420px] text-[#6B7280]">Добавьте товары, чтобы перейти к оформлению заказа.</p>
          <Link href="/catalog" className="mt-7 flex h-12 items-center justify-center rounded-2xl bg-[#6D4AFF] px-6 text-sm font-bold text-white transition hover:bg-[#4F32D9]">{t("backToCatalog")}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <Link href="/cart" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#6D4AFF] transition hover:text-[#4F32D9]"><ChevronLeft size={18} /> {t("backToCart")}</Link>
      <div className="mb-8"><h1 className="text-3xl font-black md:text-4xl">{t("checkoutTitle")}</h1><p className="mt-2 text-[#6B7280]">{t("checkoutSubtitle")}</p></div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px] lg:gap-8">
        <div className="space-y-6">
          <CheckoutBlock icon={<User size={24} />} title={t("recipient")} description={t("recipientDesc")}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label={t("name")} name="name" placeholder="Иван" defaultValue={user?.name || ""} />
              <TextField
                label="Телефон"
                name="phone"
                placeholder="+7 (900) 000-00-00"
                type="tel"
                value={phone}
                onChange={(value: string) => setPhone(formatRussianPhone(value))}
                inputMode="numeric"
                autoComplete="tel"
                minLength={18}
                maxLength={18}
              />
              <TextField label="Email" name="email" placeholder="mail@example.com" type="email" defaultValue={user?.email || ""} className="md:col-span-2" />
            </div>
          </CheckoutBlock>
          <CheckoutBlock icon={<MapPin size={24} />} title={t("address")} description={t("addressDesc")}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label={t("city")} name="city" defaultValue="Екатеринбург" />
              <TextField label={t("street")} name="street" placeholder="Ленина" />
              <TextField label={t("house")} name="house" placeholder="10" />
              <TextField label={t("apartment")} name="flat" placeholder="24" />
              <label className="md:col-span-2"><span className="text-sm font-bold text-[#111827]">{t("comment")}</span><textarea name="comment" rows={4} placeholder={t("commentPlaceholder")} className="mt-2 w-full resize-none rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#6D4AFF] focus:bg-white" /></label>
            </div>
          </CheckoutBlock>
          <CheckoutBlock icon={<Truck size={24} />} title={t("deliveryMethod")} description={t("deliveryMethodDesc")}>
            <div className="grid gap-3 md:grid-cols-2">
              <RadioCard name="delivery" value="courier" title={t("courier")} description={t("courierDesc")} defaultChecked />
              <RadioCard name="delivery" value="pickup" title={t("pickup")} description={t("pickupDesc")} />
            </div>
          </CheckoutBlock>
          <CheckoutBlock icon={<CreditCard size={24} />} title={t("payment")} description={t("paymentDesc")}>
            <div className="grid gap-3 md:grid-cols-2">
              <RadioCard name="payment" value="card" title={t("cardOnDelivery")} description={t("cardOnDeliveryDesc")} defaultChecked />
              <RadioCard name="payment" value="cash" title={t("cashOnDelivery")} description={t("cashOnDeliveryDesc")} />
            </div>
          </CheckoutBlock>
        </div>
        <aside className="h-fit rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] lg:sticky lg:top-[100px]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF]"><PackageCheck size={24} /></div>
            <div><h2 className="text-xl font-black">{t("yourOrder")}</h2><p className="text-sm text-[#6B7280]">{itemsCount} {t("items")}</p></div>
          </div>
          <div className="mt-6 max-h-[300px] space-y-4 overflow-y-auto pr-1">
            {checkoutItems.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F6F7FB] to-[#F1EDFF]"><div className="h-8 w-10 rounded-xl bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9]" /></div>
                <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-bold">{item.title}</p><p className="mt-1 text-xs text-[#6B7280]">{item.quantity} шт. × {item.price}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-4 border-t border-[#E5E7EB] pt-5 text-sm">
            <div className="flex justify-between text-[#6B7280]"><span>{t("items")}</span><span>{total.toLocaleString("ru-RU")} ₽</span></div>
            <div className="flex justify-between text-[#6B7280]"><span>{t("deliveryCost")}</span><span>{t("free")}</span></div>
            <div className="flex justify-between text-xl font-black"><span>{t("toPay")}</span><span>{total.toLocaleString("ru-RU")} ₽</span></div>
          </div>
          <button type="submit" className="mt-6 h-14 w-full rounded-2xl bg-[#6D4AFF] text-base font-bold text-white transition hover:bg-[#4F32D9]">{t("confirmOrder")}</button>
          <p className="mt-3 text-center text-xs leading-5 text-[#6B7280]">{t("orderConfirmationNote")}</p>
        </aside>
      </form>
    </section>
  );
}

// Секция формы оформления с иконкой, заголовком и описанием.
function CheckoutBlock({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[32px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-6">
      <div className="mb-5 flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF]">{icon}</div><div><h2 className="text-xl font-black">{title}</h2><p className="text-sm text-[#6B7280]">{description}</p></div></div>
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
function RadioCard({ name, value, title, description, defaultChecked }: { name: string; value: string; title: string; description: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-[92px] gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 transition hover:border-[#6D4AFF] hover:bg-white">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="mt-1 h-4 w-4 accent-[#6D4AFF]" />
      <span><span className="block font-black">{title}</span><span className="mt-1 block text-sm text-[#6B7280]">{description}</span></span>
    </label>
  );
}
