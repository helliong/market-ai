"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

type OrderStatus = "processing" | "shipping" | "ready" | "received" | "cancelled";

type Order = {
  id: string;
  date: string;
  title: string;
  itemsCount: number;
  total: string;
  status: OrderStatus;
  statusLabel: string;
  details: string;
};

const activeOrders: Order[] = [];
const completedOrders: Order[] = [];

// Экран заказов разделяет активные и завершенные заказы пользователя.
export function OrdersPage() {
  const [view, setView] = useState<"active" | "completed">("active");
  const orders = view === "active" ? activeOrders : completedOrders;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.12em] text-[#6D4AFF]">
            Покупки
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#111827] md:text-4xl">
            Мои заказы
          </h1>
          <p className="mt-2 max-w-[640px] text-[#6B7280]">
            Следите за текущими доставками и возвращайтесь к истории покупок.
          </p>
        </div>

        <div className="orders-tabs flex w-fit items-center gap-2 rounded-2xl bg-[#6D4AFF] p-1.5 shadow-[0_12px_30px_rgba(109,74,255,0.22)]">
          <OrderTab
            active={view === "active"}
            label="Активные"
            onClick={() => setView("active")}
          />
          <OrderTab
            active={view === "completed"}
            label="Завершенные"
            onClick={() => setView("completed")}
          />
        </div>
      </div>

      <div className="mt-8">
        {orders.length === 0 ? (
          <OrdersEmptyState type={view} />
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Кнопка вкладки заказов с количеством элементов в выбранной группе.
function OrderTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`orders-tab h-8 rounded-full px-3 text-sm font-black leading-none transition ${
        active
          ? "orders-tab-active border border-white bg-white text-[#6D4AFF] shadow-[0_8px_18px_rgba(15,23,42,0.10)]"
          : "orders-tab-idle border border-transparent text-white"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

// Пустое состояние для вкладок заказов, когда подходящих заказов нет.
function OrdersEmptyState({ type }: { type: "active" | "completed" }) {
  const isActive = type === "active";

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[32px] border border-dashed border-[#D1D5DB] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#F1EDFF] text-[#6D4AFF]">
        {isActive ? <Truck size={34} /> : <Package size={34} />}
      </div>
      <h2 className="mt-5 text-2xl font-black text-[#111827]">
        {isActive ? "Нет активных заказов" : "У вас еще нет завершенных заказов"}
      </h2>
      <p className="mt-3 max-w-[460px] text-sm leading-6 text-[#6B7280]">
        {isActive
          ? "Здесь появятся заказы, которые едут к вам, собираются или ждут получения в пункте выдачи."
          : "Когда вы получите заказ или отмените покупку, она сохранится здесь для истории."}
      </p>
      <Link
        href="/catalog"
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#6D4AFF] px-5 text-sm font-bold text-white transition hover:bg-[#4F32D9]"
      >
        <ShoppingBag size={18} />
        Перейти в каталог
      </Link>
    </div>
  );
}

// Карточка заказа с составом, статусом, датой и суммой.
function OrderCard({ order }: { order: Order }) {
  const isCancelled = order.status === "cancelled";
  const isCompleted = order.status === "received" || order.status === "cancelled";

  return (
    <article className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              isCancelled
                ? "bg-[#FEF2F2] text-[#EF4444]"
                : isCompleted
                  ? "bg-[#ECFDF5] text-[#10B981]"
                  : "bg-[#F1EDFF] text-[#6D4AFF]"
            }`}
          >
            {isCancelled ? (
              <XCircle size={24} />
            ) : isCompleted ? (
              <CheckCircle2 size={24} />
            ) : (
              <Clock3 size={24} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#6B7280]">
              Заказ #{order.id} • {order.date}
            </p>
            <h3 className="mt-1 truncate text-lg font-black text-[#111827]">
              {order.title}
            </h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              {order.itemsCount} товара • {order.total}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span
            className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-black ${
              isCancelled
                ? "bg-[#FEF2F2] text-[#EF4444]"
                : isCompleted
                  ? "bg-[#ECFDF5] text-[#047857]"
                  : "bg-[#F1EDFF] text-[#6D4AFF]"
            }`}
          >
            {order.statusLabel}
          </span>
          <span className="text-sm font-semibold text-[#6B7280]">{order.details}</span>
        </div>
      </div>
    </article>
  );
}
