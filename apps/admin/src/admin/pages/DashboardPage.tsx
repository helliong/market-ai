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
} from "lucide-react";
import type { ReactNode } from "react";
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
  const activeOrders = orders.filter((order) => order.status !== "cancelled");
  const averageCheck =
    activeOrders.length > 0 ? stats.revenue / activeOrders.length : 0;
  const activeProducts = products.filter((product) => product.status === "active");
  const draftProducts = products.filter((product) => product.status === "draft");
  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  );
  const outOfStockProducts = products.filter((product) => product.stock === 0);
  const processingOrders = orders.filter(
    (order) => order.status === "processing",
  );
  const statusStats = (["processing", "completed", "cancelled"] as OrderStatus[]).map(
    (status) => ({
      status,
      label: orderStatusLabels[status],
      value: orders.filter((order) => order.status === status).length,
      tone: orderStatusTones[status],
    }),
  );
  const maxStatusCount = Math.max(...statusStats.map((item) => item.value), 1);
  const topProducts = getTopProducts(orders, products);
  const hasActivity =
    stats.products > 0 || stats.orders > 0 || stats.users > 0 || stats.revenue > 0;

  return (
    <section className="dashboard-overview" aria-label="Обзор магазина">
      <div className="dashboard-heading">
        <div>
          <h2>Обзор</h2>
          <p>Контроль продаж, заказов и состояния магазина</p>
        </div>

        <div className="dashboard-periods" aria-label="Период отчета">
          <button type="button" className="active">
            Сегодня
          </button>
          <button type="button">7 дней</button>
          <button type="button">30 дней</button>
          <span>Обновлено 12:40</span>
        </div>
      </div>

      <div className="dashboard-metrics" aria-label="Ключевые показатели">
        <MetricCard
          icon={<TrendingUp />}
          tone="green"
          label="Выручка"
          value={formatCurrency(stats.revenue)}
          caption={stats.revenue > 0 ? "+12% к периоду" : "Пока нет продаж"}
        />
        <MetricCard
          icon={<ShoppingBag />}
          tone="blue"
          label="Заказы"
          value={String(stats.orders)}
          caption={`${processingOrders.length} в обработке`}
        />
        <MetricCard
          icon={<Wallet />}
          tone="teal"
          label="Средний чек"
          value={formatCurrency(averageCheck)}
          caption={averageCheck > 0 ? "+4% к периоду" : "Нет активных заказов"}
        />
        <MetricCard
          icon={<Package />}
          tone="violet"
          label="Товары"
          value={String(activeProducts.length)}
          caption={`${draftProducts.length} черновиков`}
        />
        <MetricCard
          icon={<Boxes />}
          tone="amber"
          label="Остатки"
          value={String(lowStockProducts.length)}
          caption="заканчиваются"
        />
        <MetricCard
          icon={<Users />}
          tone="violet"
          label="Команда"
          value={String(users.length)}
          caption={pluralizeUsers(users.length)}
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
                <span>{item.label}</span>
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
}: {
  icon: ReactNode;
  tone: "green" | "blue" | "teal" | "violet" | "amber";
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <article className="dashboard-metric-card">
      <span className={`dashboard-icon ${tone}`}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{caption}</span>
      </div>
    </article>
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
  icon: ReactNode;
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
