"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import {
  cancelOrder,
  fetchOrders,
  type ApiOrder,
  type ApiOrderItem,
} from "@/lib/order-api";

type OrderView = {
  id: string;
  serverOrderId?: string;
  publicId: string;
  date: string;
  title: string;
  itemsCount: number;
  total: string;
  status: "processing" | "shipping" | "ready" | "received" | "cancelled";
  statusLabel: string;
  details: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  isServerOrder: boolean;
};

export function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get("selectedTab");
  const view = selectedTab === "archive" ? "completed" : "active";
  const [serverOrders, setServerOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [cancellingOrderId, setCancellingOrderId] = useState<string>();

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setLoadError(undefined);

    fetchOrders()
      .then((orders) => {
        if (isMounted) {
          setServerOrders(orders);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Не удалось загрузить заказы",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const mappedServerOrders = useMemo(
    () => serverOrders.map(mapApiOrderToView),
    [serverOrders],
  );
  const activeServerOrders = mappedServerOrders.filter(
    (order) => !isCompletedOrder(order),
  );
  const completedServerOrders = mappedServerOrders.filter(isCompletedOrder);
  const orders = view === "active" ? activeServerOrders : completedServerOrders;

  function selectTab(nextTab: "active" | "archive") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedTab", nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.12em] text-[#6D4AFF]">
            Покупки
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#111827] md:text-4xl">
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
            onClick={() => selectTab("active")}
          />
          <OrderTab
            active={view === "completed"}
            label="Завершенные"
            onClick={() => selectTab("archive")}
          />
        </div>
      </div>

      {loadError && (
        <div className="mt-6 rounded-2xl bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#DC2626]">
          {loadError}
        </div>
      )}

      <div className="mt-8">
        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[32px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <Loader2 className="animate-spin text-[#6D4AFF]" size={34} />
          </div>
        ) : orders.length === 0 ? (
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

function OrdersEmptyState({ type }: { type: "active" | "completed" }) {
  const isActive = type === "active";

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[32px] border border-dashed border-[#D1D5DB] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="order-icon flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#F1EDFF] text-[#6D4AFF]">
        {isActive ? <Truck size={34} /> : <Package size={34} />}
      </div>
      <h2 className="mt-5 text-2xl font-black text-[#111827]">
        {isActive ? "Нет активных заказов" : "Пока нет завершенных заказов"}
      </h2>
      <p className="mt-3 max-w-[460px] text-sm leading-6 text-[#6B7280]">
        {isActive
          ? "Здесь появятся заказы, которые оплачиваются, собираются или едут к вам."
          : "Полученные и отмененные заказы будут храниться здесь для истории."}
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

function OrderCard({ order }: { order: OrderView }) {
  const isCancelled = order.status === "cancelled";
  const isCompleted = isCompletedOrder(order);

  return (
    <article className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className={`order-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
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
            <Link
              href={`/orders/${order.id}`}
              className="text-sm font-bold text-[#6B7280] hover:text-[#6D4AFF] transition"
            >
              Заказ #{order.publicId} · {order.date}
            </Link>
            <Link href={`/orders/${order.id}`}>
              <h3 className="mt-1 text-lg font-black text-[#111827] hover:text-[#6D4AFF] transition">
                {order.title}
              </h3>
            </Link>
            <p className="mt-1 text-sm text-[#6B7280]">
              {formatItemsCount(order.itemsCount)} · {order.total}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <span
            className={`inline-flex h-9 w-fit items-center justify-center rounded-full px-4 text-xs font-black ${
              isCancelled
                ? "bg-[#FEF2F2] text-[#EF4444]"
                : isCompleted
                  ? "bg-[#ECFDF5] text-[#047857]"
                  : "bg-[#F1EDFF] text-[#6D4AFF]"
            }`}
          >
            {order.statusLabel}
          </span>
          <span className="max-w-[360px] text-sm font-semibold text-[#6B7280] lg:text-right">
            {order.details}
          </span>
        </div>
      </div>
    </article>
  );
}

function buildFallbackItems(order: OrderView) {
  if (order.itemsCount <= 0) {
    return [];
  }

  const knownTitle = order.title.replace(/\s+и еще\s+\d+$/i, "").trim();
  const items = [
    {
      id: `${order.id}-known`,
      title: knownTitle || "Товар из заказа",
      quantity: 1,
      price: "Цена в составе заказа",
      total: "Входит в сумму заказа",
    },
  ];

  for (let index = 1; index < order.itemsCount; index += 1) {
    items.push({
      id: `${order.id}-legacy-${index}`,
      title: "Товар из старого заказа",
      quantity: 1,
      price: "Данные не сохранились",
      total: "Входит в сумму заказа",
    });
  }

  return items;
}

function mapApiOrderToView(order: ApiOrder): OrderView {
  const items = order.items.map(mapApiItemToView);
  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const status = normalizeOrderStatus(order.status, order.fulfillmentStatus);

  return {
    id: order.id,
    serverOrderId: order.id,
    publicId: order.publicId || order.id.slice(0, 8).toUpperCase(),
    date: formatDate(order.createdAt),
    title: buildOrderTitle(items),
    itemsCount,
    total: formatMoney(order.grandTotal, order.currency),
    status,
    ...getStatusCopy(status),
    items,
    isServerOrder: true,
  };
}

function mapApiItemToView(item: ApiOrderItem) {
  return {
    id: item.id,
    title: item.productTitleSnapshot,
    quantity: item.quantity,
    price: formatMoney(item.productPriceSnapshot, "RUB"),
    total: formatMoney(item.lineTotal, "RUB"),
  };
}

function normalizeOrderStatus(status: string, fulfillmentStatus: string) {
  const normalizedStatus = status.toLowerCase();
  const normalizedFulfillmentStatus = fulfillmentStatus.toLowerCase();

  if (normalizedStatus.includes("cancel")) return "cancelled";
  if (normalizedStatus.includes("complete")) return "received";
  if (normalizedStatus.includes("shipping")) return "shipping";
  if (normalizedStatus.includes("ready")) return "ready";
  if (normalizedFulfillmentStatus.includes("shipped")) return "shipping";
  if (normalizedFulfillmentStatus.includes("ready")) return "ready";
  if (normalizedFulfillmentStatus.includes("received")) return "received";
  return "processing";
}

function getStatusCopy(status: OrderView["status"]) {
  if (status === "cancelled") {
    return {
      statusLabel: "Отменен",
      details:
        "Заказ перенесен в завершенные. Деньги по оплаченной покупке требуют отдельного возврата.",
    };
  }

  if (status === "received") {
    return {
      statusLabel: "Получен",
      details: "Покупка завершена. Детали заказа сохранены в истории.",
    };
  }

  if (status === "shipping") {
    return {
      statusLabel: "В пути",
      details: "Заказ передан в доставку. Обновления появятся здесь.",
    };
  }

  if (status === "ready") {
    return {
      statusLabel: "Готов к получению",
      details: "Можно забирать заказ в выбранном пункте выдачи.",
    };
  }

  return {
    statusLabel: "Заказ принят",
    details:
      "Мы уже передали заказ продавцу и обновим статус, когда он будет готов к отправке.",
  };
}

function isCompletedOrder(order: OrderView) {
  return order.status === "received" || order.status === "cancelled";
}

function buildOrderTitle(items: OrderView["items"]) {
  if (items.length === 0) return "Заказ";
  if (items.length === 1) return items[0].title;
  return `${items[0].title} и еще ${items.length - 1}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(value: string | number, currency: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `${value} ${currency}`;
  }

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatItemsCount(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} товара`;
  }

  return `${count} товаров`;
}
