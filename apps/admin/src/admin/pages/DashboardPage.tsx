import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  Clock3,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
  Info,
} from "lucide-react";
import { useState, useMemo } from "react";
import { formatCurrency } from "../formatters";
import type { Order, OrderStatus, Product, User } from "../types";

type DashboardPageProps = {
  stats: {
    products: number;
    orders: number;
    users: number;
    revenue: number;
  };
  orders: Order[];
  products: Product[];
  users: User[];
  onNavigate: (page: "products" | "orders") => void;
};

const orderStatusLabels: Record<OrderStatus, string> = {
  processing: "В обработке",
  completed: "Завершены",
  cancelled: "Отменены",
};

const orderStatusTones: Record<OrderStatus, "blue" | "green" | "red"> = {
  processing: "blue",
  completed: "green",
  cancelled: "red",
};

export function DashboardPage({
  stats,
  orders,
  products,
  users,
  onNavigate,
}: DashboardPageProps) {
  const [period, setPeriod] = useState<"today" | "7d" | "30d">("today");

  const {
    currentRevenue,
    prevRevenue,
    currentAverage,
    prevAverage,
    revenueGrowth,
    averageGrowth,
    filteredOrdersCount,
    currentCancelledCount,
  } = useMemo(() => {
    const { currentStart, currentEnd, prevStart, prevEnd } =
      getPeriodRange(period);

    const currentOrders = orders.filter((o) => {
      if (o.status === "cancelled") return false;
      const d = new Date(o.createdAt);
      return d >= currentStart && d <= currentEnd;
    });

    const prevOrders = orders.filter((o) => {
      if (o.status === "cancelled") return false;
      const d = new Date(o.createdAt);
      return d >= prevStart && d <= prevEnd;
    });

    const cRev = currentOrders.reduce((sum, o) => sum + o.total, 0);
    const pRev = prevOrders.reduce((sum, o) => sum + o.total, 0);

    const cAvg = currentOrders.length > 0 ? cRev / currentOrders.length : 0;
    const pAvg = prevOrders.length > 0 ? pRev / prevOrders.length : 0;

    const rGrowth = pRev > 0 ? Math.round(((cRev - pRev) / pRev) * 100) : cRev > 0 ? 100 : 0;
    const aGrowth = pAvg > 0 ? Math.round(((cAvg - pAvg) / pAvg) * 100) : cAvg > 0 ? 100 : 0;

    const currentCancelledCount = orders.filter((o) => {
      // Только отмены со стороны продавца имеют cancellationReason
      if (o.status !== "cancelled" || !o.cancellationReason) return false;
      const d = getStatusEventDate(o, "cancelled");
      return Boolean(d && d >= currentStart && d <= currentEnd);
    }).length;

    return {
      currentRevenue: cRev,
      prevRevenue: pRev,
      currentAverage: cAvg,
      prevAverage: pAvg,
      revenueGrowth: rGrowth,
      averageGrowth: aGrowth,
      filteredOrdersCount: currentOrders.length,
      currentCancelledCount,
    };
  }, [orders, period]);
  const activeProducts = products.filter((product) => product.status === "active");
  const draftProducts = products.filter((product) => product.status === "draft");
  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  );
  const outOfStockProducts = products.filter((product) => product.stock === 0);
  const processingOrders = orders.filter(
    (order) => order.status === "processing",
  );
  const currentPeriodRange = useMemo(() => getPeriodRange(period), [period]);
  const statusStats = (["processing", "completed", "cancelled"] as OrderStatus[]).map(
    (status) => ({
      status,
      label: orderStatusLabels[status],
      value: orders.filter((order) => {
        if (order.status !== status) return false;
        // Для 'cancelled' учитываем только отмены продавца (есть причина)
        if (status === "cancelled" && !order.cancellationReason) return false;
        const eventDate = getStatusEventDate(order, status);
        return Boolean(
          eventDate &&
            eventDate >= currentPeriodRange.currentStart &&
            eventDate <= currentPeriodRange.currentEnd,
        );
      }).length,
      tone: orderStatusTones[status],
    }),
  );
  const maxStatusCount = Math.max(...statusStats.map((item) => item.value), 1);
  const topProducts = getTopProducts(orders, products);
  const hasActivity =
    stats.products > 0 || stats.orders > 0 || stats.users > 0 || stats.revenue > 0;

  const maxCancellations = period === "today" ? 5 : period === "7d" ? 10 : 15;
  const isCancellationsHigh = currentCancelledCount > maxCancellations;
  const cancellationsTooltipText = isCancellationsHigh
    ? "Внимание: критический уровень отмен! При систематических отменах заказов работа вашего магазина может быть приостановлена платформой. Пожалуйста, следите за актуальностью остатков."
    : "Количество отмененных заказов. Старайтесь избегать частых отмен: это негативно влияет на рейтинг и может привести к временной блокировке магазина.";

  return (
    <section className="dashboard-overview" aria-label="Обзор магазина">
      <div className="dashboard-heading">
        <div>
          <h2>Обзор</h2>
          <p>Контроль продаж, заказов и состояния магазина</p>
        </div>

        <div className="dashboard-periods" aria-label="Период отчета">
          <button type="button" className={period === "today" ? "active" : ""} onClick={() => setPeriod("today")}>
            Сегодня
          </button>
          <button type="button" className={period === "7d" ? "active" : ""} onClick={() => setPeriod("7d")}>7 дней</button>
          <button type="button" className={period === "30d" ? "active" : ""} onClick={() => setPeriod("30d")}>30 дней</button>
          <span>Обновлено 12:40</span>
        </div>
      </div>

      <div className="dashboard-metrics" aria-label="Ключевые показатели">
        <MetricCard
          icon={<TrendingUp />}
          tone={revenueGrowth >= 0 ? "green" : "red"}
          label="Выручка"
          value={formatCurrency(currentRevenue)}
          caption={currentRevenue > 0 || prevRevenue > 0 ? `${revenueGrowth > 0 ? "+" : ""}${revenueGrowth}% к прошлому периоду` : "Пока нет продаж"}
          tooltip="Сумма всех успешно оплаченных и завершенных заказов (за вычетом отмененных) за выбранный период. Процент роста считается относительно предыдущего аналогичного периода."
        />
        <MetricCard
          icon={<ShoppingBag />}
          tone="blue"
          label="Заказы"
          value={String(filteredOrdersCount)}
          caption={`${processingOrders.length} в обработке (за всё время)`}
          tooltip="Общее число заказов (без учета отмененных), оформленных за выбранный период."
        />
        <MetricCard
          icon={<Wallet />}
          tone={averageGrowth >= 0 ? "teal" : "red"}
          label="Средний чек"
          value={formatCurrency(currentAverage)}
          caption={currentAverage > 0 || prevAverage > 0 ? `${averageGrowth > 0 ? "+" : ""}${averageGrowth}% к прошлому периоду` : "Нет активных заказов"}
          tooltip="Выручка, поделенная на количество заказов за выбранный период."
        />
        <MetricCard
          icon={<Package />}
          tone="violet"
          label="Товары"
          value={String(activeProducts.length)}
          caption={`${draftProducts.length} черновиков`}
          tooltip="Количество активных товаров, доступных покупателям. Черновики не участвуют в поиске."
        />
        <MetricCard
          icon={<Boxes />}
          tone="amber"
          label="Остатки"
          value={String(lowStockProducts.length)}
          caption="заканчиваются"
          tooltip="Считаются товары, которых осталось от 1 до 5 шт. (включительно). Это помогает вовремя пополнять запасы, чтобы не терять продажи."
        />
        <MetricCard
          icon={<Users />}
          tone="violet"
          label="Команда"
          value={String(users.length)}
          caption={pluralizeUsers(users.length)}
          tooltip="Количество пользователей, имеющих доступ к управлению магазином."
        />
      </div>

      <div className="dashboard-main-grid">
        <article className="dashboard-panel">
          <PanelHeader title="Что требует внимания" />
          <div className="attention-list">
            <AttentionItem
              icon={<ShoppingBag />}
              tone="blue"
              label={`${processingOrders.length} заказов ждут обработки`}
            />
            <AttentionItem
              icon={<Clock3 />}
              tone="amber"
              label={`${lowStockProducts.length} товаров почти закончились`}
            />
            <AttentionItem
              icon={<AlertTriangle />}
              tone="amber"
              label={`${outOfStockProducts.length} товаров без остатка`}
            />
            <AttentionItem
              icon={<XCircle />}
              tone="red"
              label={`${draftProducts.length} товаров в черновиках`}
            />
          </div>

          <div className="dashboard-actions">
            <button
              type="button"
              className="dashboard-primary-action"
              onClick={() => onNavigate("orders")}
            >
              Открыть заказы
            </button>
            <button
              type="button"
              className="dashboard-secondary-action"
              onClick={() => onNavigate("products")}
            >
              Проверить остатки
            </button>
          </div>
        </article>

        <article className="dashboard-panel">
          <PanelHeader title="Заказы по статусам" />
          <div className="status-bars">
            {statusStats.map((item) => (
              <div className="status-bar-row" key={item.status}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {item.label}
                  {item.status === "cancelled" && (
                    <InlineTooltip
                      text={cancellationsTooltipText}
                      tone={isCancellationsHigh ? "red" : "gray"}
                    />
                  )}
                </span>
                <div className="status-bar-track">
                  <div
                    className={`status-bar-fill ${item.tone}`}
                    style={{ width: `${(item.value / maxStatusCount) * 100}%` }}
                  />
                </div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="dashboard-main-grid">
        <article className="dashboard-panel">
          <PanelHeader
            title="Последние заказы"
            actionLabel="Посмотреть все"
            onAction={() => onNavigate("orders")}
          />
          <div className="dashboard-table-list">
            {orders.slice(0, 3).map((order) => (
              <button
                type="button"
                className="dashboard-order-row"
                key={order.id}
                onClick={() => onNavigate("orders")}
              >
                <span className="row-id">#{order.publicId}</span>
                <span className="row-title">{order.productName}</span>
                <span className="row-price">{formatCurrency(order.total)}</span>
                <span className={`dashboard-status ${order.status}`}>
                  {orderStatusLabels[order.status]}
                </span>
                <ArrowRight aria-hidden="true" />
              </button>
            ))}

            {orders.length === 0 && (
              <EmptyPanel text="Заказы появятся здесь после первой продажи." />
            )}
          </div>
        </article>

        <article className="dashboard-panel">
          <PanelHeader
            title="Лучшие товары"
            actionLabel="Посмотреть все"
            onAction={() => onNavigate("products")}
          />
          <div className="dashboard-table-list">
            {topProducts.map((product, index) => (
              <button
                type="button"
                className="dashboard-product-row"
                key={product.name}
                onClick={() => onNavigate("products")}
              >
                <span className="product-rank">{index + 1}</span>
                <span className="product-thumb">
                  <Package aria-hidden="true" />
                </span>
                <span className="row-title">{product.name}</span>
                <span className="row-price">{formatCurrency(product.revenue)}</span>
                <span className="row-muted">{product.quantity} шт.</span>
              </button>
            ))}

            {topProducts.length === 0 && (
              <EmptyPanel text="Топ товаров появится после заказов." />
            )}
          </div>
        </article>
      </div>

      <article className="dashboard-insight">
        <span className="insight-icon">
          <Sparkles aria-hidden="true" />
        </span>
        <div>
          <h3>Подсказка MarketAI</h3>
          <p>
            {lowStockProducts.length > 0
              ? `${lowStockProducts.length} товаров заканчиваются. Пополните остатки, чтобы не терять продажи.`
              : "Остатки выглядят стабильно. Проверьте популярные товары перед пиковыми днями продаж."}
          </p>
        </div>
        <button type="button" onClick={() => onNavigate("products")}>
          Перейти к товарам
        </button>
      </article>

      {!hasActivity && (
        <div className="dashboard-empty-state">
          <BarChart3 aria-hidden="true" />
          <div>
            <h3>Данных пока нет</h3>
            <p>Добавьте товары и дождитесь первых заказов, чтобы обзор стал полезнее.</p>
          </div>
        </div>
      )}
    </section>
  );
}

function MetricCard({
  icon,
  tone,
  label,
  value,
  caption,
  tooltip,
}: {
  icon: React.ReactNode;
  tone: "green" | "blue" | "teal" | "violet" | "amber" | "red";
  label: string;
  value: string;
  caption: string;
  tooltip?: string;
}) {
  return (
    <article className="dashboard-metric-card">
      <span className={`dashboard-icon ${tone}`}>{icon}</span>
      <div>
        <p style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
          <span>{label}</span>
          {tooltip && <InlineTooltip text={tooltip} />}
        </p>
        <strong>{value}</strong>
        <span>{caption}</span>
      </div>
    </article>
  );
}

function InlineTooltip({ text, tone = "gray" }: { text: string; tone?: "gray" | "red" }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const color = tone === "red" ? "#ef4444" : "currentColor";

  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", transform: "translateY(-1px)" }}>
      <Info
        size={14}
        style={{ cursor: "pointer", opacity: tone === "red" ? 1 : 0.5, transition: "opacity 0.2s", color }}
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      />
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "8px",
            backgroundColor: "#1f2937",
            color: "#ffffff",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "13px",
            width: "240px",
            zIndex: 20,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            lineHeight: 1.4,
            fontWeight: "normal",
            pointerEvents: "none",
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}

function PanelHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="dashboard-panel-header">
      <h3>{title}</h3>
      {actionLabel && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function AttentionItem({
  icon,
  tone,
  label,
}: {
  icon: React.ReactNode;
  tone: "blue" | "amber" | "red";
  label: string;
}) {
  return (
    <button type="button" className="attention-item">
      <span className={`attention-icon ${tone}`}>{icon}</span>
      <span>{label}</span>
      <ArrowRight aria-hidden="true" />
    </button>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return <p className="dashboard-list-empty">{text}</p>;
}

function getPeriodRange(period: "today" | "7d" | "30d") {
  const currentEnd = new Date();
  const currentStart = new Date(currentEnd);
  let prevStart = new Date(currentEnd);
  let prevEnd = new Date(currentEnd);

  if (period === "today") {
    currentStart.setHours(0, 0, 0, 0);
    prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - 1);
    prevEnd = new Date(currentStart);
    prevEnd.setMilliseconds(-1);
  } else {
    const days = period === "7d" ? 7 : 30;
    currentStart.setDate(currentEnd.getDate() - days);
    prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - days);
    prevEnd = new Date(currentStart);
    prevEnd.setMilliseconds(-1);
  }

  return { currentStart, currentEnd, prevStart, prevEnd };
}

function getStatusEventDate(order: Order, status: OrderStatus) {
  if (status === "completed") {
    return parseOrderDate(order.completedAt ?? order.updatedAt);
  }

  if (status === "cancelled") {
    return parseOrderDate(order.cancelledAt ?? order.updatedAt);
  }

  return parseOrderDate(order.createdAt);
}

function parseOrderDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTopProducts(orders: Order[], products: Product[]) {
  const revenueByProduct = new Map<string, { revenue: number; quantity: number }>();

  orders
    .filter((order) => order.status !== "cancelled")
    .forEach((order) => {
      if (order.items?.length) {
        order.items.forEach((item) => {
          const current = revenueByProduct.get(item.productName) ?? {
            revenue: 0,
            quantity: 0,
          };
          revenueByProduct.set(item.productName, {
            revenue: current.revenue + item.price * item.quantity,
            quantity: current.quantity + item.quantity,
          });
        });
        return;
      }

      const current = revenueByProduct.get(order.productName) ?? {
        revenue: 0,
        quantity: 0,
      };
      revenueByProduct.set(order.productName, {
        revenue: current.revenue + order.total,
        quantity: current.quantity + 1,
      });
    });

  const fromOrders = Array.from(revenueByProduct.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((first, second) => second.revenue - first.revenue)
    .slice(0, 3);

  if (fromOrders.length > 0) {
    return fromOrders;
  }

  return products
    .slice()
    .sort((first, second) => second.price - first.price)
    .slice(0, 3)
    .map((product) => ({
      name: product.name,
      revenue: product.price,
      quantity: product.stock,
    }));
}

function pluralizeUsers(count: number) {
  if (count === 1) {
    return "пользователь";
  }

  if (count > 1 && count < 5) {
    return "пользователя";
  }

  return "пользователей";
}
