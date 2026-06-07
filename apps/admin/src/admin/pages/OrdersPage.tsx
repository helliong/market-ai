import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsRight,
  CircleX,
  Clock3,
  CreditCard,
  MapPin,
  MessageCircle,
  PackageCheck,
  Search,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { formatCurrency } from "../formatters";
import type { Order, OrderStatus } from "../types";

type OrdersPageProps = {
  orders: Order[];
  onStatusChange: (orderId: string, status: OrderStatus, reason?: string) => void;
};

type StatusFilter = "all" | OrderStatus;

const statusLabels: Record<OrderStatus, string> = {
  processing: "В работе",
  completed: "Готовый",
  cancelled: "Отменен",
};

const statusToneLabels: Record<OrderStatus, string> = {
  processing: "processing",
  completed: "completed",
  cancelled: "cancelled",
};

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "processing", label: "В работе" },
  { value: "completed", label: "Готовые" },
  { value: "cancelled", label: "Отмененные" },
];

const timelineSteps = ["Новый", "Подтвержден", "Сборка", "Передан"];

function getOrderDate(index: number) {
  return `13.05.2025 в ${String(14 - (index % 4)).padStart(2, "0")}:${String(
    32 - index * 3,
  ).padStart(2, "0")}`;
}

export function OrdersPage({ orders, onStatusChange }: OrdersPageProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    orders.length > 0 ? orders[0].id : null,
  );
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("Нет в наличии");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    orders[0]?.id ?? null,
  );

  useEffect(() => {
    if (orders.length === 0 || selectedOrderId) {
      return;
    }

    setSelectedOrderId(orders[0].id);
    setExpandedOrderId(orders[0].id);
  }, [orders, selectedOrderId]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [order.publicId, order.sku, order.productName, order.customer]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [orders, query, statusFilter]);

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ??
    filteredOrders[0] ??
    orders[0];

  const stats = useMemo(
    () => ({
      processing: orders.filter((order) => order.status === "processing").length,
      completed: orders.filter((order) => order.status === "completed").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
    }),
    [orders],
  );

  function selectOrder(orderId: string) {
    setSelectedOrderId(orderId);
    setExpandedOrderId((current) => (current === orderId ? null : orderId));
  }

  return (
    <section className="orders-workspace" aria-label="Заказы">
      <div className="orders-page-header">
        <div>
          <h2>Заказы</h2>
          <p>Приоритеты, статусы и детали отгрузки в одном месте</p>
        </div>
      </div>

      <div className="orders-stats" aria-label="Сводка по заказам">
        <OrderStat
          icon={<Clock3 />}
          label="В обработке"
          value={stats.processing}
          tone="processing"
        />
        <OrderStat
          icon={<CheckCircle2 />}
          label="Завершены"
          value={stats.completed}
          tone="completed"
        />
        <OrderStat
          icon={<CircleX />}
          label="Отменены"
          value={stats.cancelled}
          tone="cancelled"
        />
      </div>

      <div className="orders-toolbar">
        <label className="orders-search">
          <Search aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по заказу, SKU или покупателю"
          />
        </label>

        <div className="orders-segments" aria-label="Фильтр по статусу">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={statusFilter === option.value ? "active" : ""}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button type="button" className="orders-filter-button">
          <CalendarDays aria-hidden="true" />
          13.05.2025 - 19.05.2025
          <ChevronDown aria-hidden="true" />
        </button>

        <button type="button" className="orders-filter-button">
          Сортировка: новые сверху
          <ChevronDown aria-hidden="true" />
        </button>
      </div>

      <div className="orders-board">
        <div className="orders-list-modern">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const isSelected = selectedOrder?.id === order.id;
            const tone = statusToneLabels[order.status];

            return (
              <article
                key={order.id}
                className={`order-row-card ${isExpanded ? "is-expanded" : ""} ${
                  isSelected ? "is-selected" : ""
                }`}
              >
                <button
                  type="button"
                  className="order-row-summary"
                  onClick={() => selectOrder(order.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="order-expand-icon">
                    {isExpanded ? <ChevronDown /> : <ChevronRight />}
                  </span>

                  <span className="order-row-customer">
                    <strong>Заказ №{order.publicId}</strong>
                    <span>{order.customer}</span>
                  </span>

                  <span className={`order-status-pill ${tone}`}>
                    {statusLabels[order.status]}
                  </span>

                  <span className="order-row-product">
                    <strong>{order.productName}</strong>
                    <span>SKU: {order.sku}</span>
                  </span>

                  <span className="order-row-total">{formatCurrency(order.total)}</span>
                </button>

                <div className="order-row-actions">
                  <select
                    className={`order-status-select ${tone}`}
                    value={order.status}
                    onChange={(event) =>
                      onStatusChange(order.id, event.target.value as OrderStatus)
                    }
                    aria-label={`Изменить статус заказа ${order.publicId}`}
                    disabled={order.status === "cancelled"}
                  >
                    <option value="processing">В работе</option>
                    <option value="completed">Готовый</option>
                    {order.status === "cancelled" && (
                      <option value="cancelled">Отменен</option>
                    )}
                  </select>
                </div>

                {isExpanded && (
                  <div className="order-card-details">
                    <div className="order-item-table">
                      <div className="order-item-head">
                        <span>Товар</span>
                        <span>Количество</span>
                        <span>Цена</span>
                        <span>Сумма</span>
                      </div>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <div key={item.id} className="order-item-row">
                            <span className="order-product-cell">
                              <span className="order-product-thumb">
                                <PackageCheck aria-hidden="true" />
                              </span>
                              <span>
                                <strong>{item.productName}</strong>
                                <small>SKU: {item.sku}</small>
                              </span>
                            </span>
                            <span>{item.quantity} шт.</span>
                            <span>{formatCurrency(item.price)}</span>
                            <span>{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="order-item-row">
                          <span className="order-product-cell">
                            <span className="order-product-thumb">
                              <PackageCheck aria-hidden="true" />
                            </span>
                            <span>
                              <strong>{order.productName}</strong>
                              <small>SKU: {order.sku}</small>
                            </span>
                          </span>
                          <span>1 шт.</span>
                          <span>{formatCurrency(order.total)}</span>
                          <span>{formatCurrency(order.total)}</span>
                        </div>
                      )}
                    </div>

                    <div className="order-delivery-grid">
                      <DetailMini
                        icon={<Truck />}
                        title="Доставка"
                        lines={["СДЭК до ПВЗ", "1-2 дня"]}
                      />
                      <DetailMini
                        icon={<UserRound />}
                        title="Покупатель"
                        lines={[order.customer, "+7 912 345-67-89"]}
                      />
                      <DetailMini
                        icon={<MapPin />}
                        title="Пункт выдачи"
                        lines={["СДЭК ПВЗ №1234", "г. Москва, ул. Ленина, 12"]}
                      />
                      {order.status === "cancelled" && order.cancellationReason && (
                        <DetailMini
                          icon={<CircleX />}
                          title="Причина отмены"
                          lines={[order.cancellationReason]}
                        />
                      )}
                    </div>

                    {order.status !== "cancelled" && (
                      <div className="order-detail-actions">
                        <button type="button" className="orders-outline-button">
                          <MessageCircle aria-hidden="true" />
                          Написать
                        </button>
                        {order.status !== "completed" && (
                          <>
                            <button
                              type="button"
                              className="orders-primary-button"
                              onClick={() => onStatusChange(order.id, "completed")}
                            >
                              <PackageCheck aria-hidden="true" />
                              Собрать заказ
                            </button>
                            <button
                              type="button"
                              className="orders-danger-outline-button"
                              onClick={() => setCancelingOrderId(order.id)}
                            >
                              <X aria-hidden="true" />
                              Отменить
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="orders-empty">
              <PackageCheck aria-hidden="true" />
              <h3>Заказы не найдены</h3>
              <p>Попробуйте изменить поиск или фильтр по статусу.</p>
            </div>
          )}

          {filteredOrders.length > 0 && (
            <div className="orders-pagination">
              <span>
                Показано 1-{filteredOrders.length} из {orders.length} заказов
              </span>
              <div className="orders-pages">
                <button type="button" className="active">
                  1
                </button>
                <button type="button">2</button>
                <button type="button">3</button>
                <span>...</span>
                <button type="button">
                  <ChevronsRight aria-hidden="true" />
                </button>
              </div>
              <button type="button" className="orders-page-size">
                20 на странице
                <ChevronDown aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {selectedOrder && (
          <aside className="order-inspector" aria-label="Детали заказа">
            <div className="order-inspector-header">
              <h3>Детали заказа</h3>
              <button type="button" aria-label="Закрыть детали">
                <X aria-hidden="true" />
              </button>
            </div>

            <div className="order-inspector-title">
              <div>
                <strong>Заказ №{selectedOrder.publicId}</strong>
                <span>{getOrderDate(0)}</span>
              </div>
              <span className={`order-status-pill ${statusToneLabels[selectedOrder.status]}`}>
                {statusLabels[selectedOrder.status]}
              </span>
            </div>

            <ol className="order-timeline">
              {(selectedOrder.status === "cancelled"
                ? ["В работе", "Отменен"]
                : ["В работе", "Сборка", "Передан", "Готовый"]
              ).map((step, index) => {
                let liClass = "";
                if (selectedOrder.status === "cancelled") {
                  liClass = index === 0 ? "done" : "active error";
                } else if (selectedOrder.status === "completed") {
                  liClass = "done";
                } else {
                  liClass = index === 0 ? "active" : "";
                }

                return (
                  <li key={step} className={liClass}>
                    <span aria-hidden="true" />
                    <div>
                      <strong>{step}</strong>
                      {index === 0 && <small>{getOrderDate(index)}</small>}
                    </div>
                  </li>
                );
              })}
            </ol>

            <InspectorSection
              icon={<UserRound />}
              title="Покупатель"
              lines={[selectedOrder.customer, "+7 912 345-67-89", "ivan.petrov@example.com"]}
            />
            <InspectorSection
              icon={<CreditCard />}
              title="Оплата"
              lines={["Онлайн-оплата", `Оплачено · ${formatCurrency(selectedOrder.total)}`]}
            />
            <InspectorSection
              icon={<Truck />}
              title="Доставка"
              lines={["СДЭК до ПВЗ", "ПВЗ №1234", "г. Москва, ул. Ленина, 12", "1-2 дня"]}
            />
            <InspectorSection
              icon={<MessageCircle />}
              title="Комментарий покупателя"
              lines={["—"]}
            />
            {selectedOrder.status === "cancelled" && selectedOrder.cancellationReason && (
              <InspectorSection
                icon={<CircleX />}
                title="Причина отмены"
                lines={[selectedOrder.cancellationReason]}
              />
            )}
          </aside>
        )}

        {cancelingOrderId && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <div>
                  <h2>Отмена заказа</h2>
                  <p>Пожалуйста, укажите причину отмены. Эта информация повлияет на рейтинг продавца.</p>
                </div>
                <button
                  className="close-button"
                  onClick={() => setCancelingOrderId(null)}
                  aria-label="Закрыть"
                >
                  ×
                </button>
              </div>

              <div className="product-form" style={{ padding: "0 24px 24px" }}>
                <label>
                  Причина отмены
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  >
                    <option value="Нет в наличии">Нет в наличии</option>
                    <option value="Товар бракованный">Товар бракованный</option>
                    <option value="Невозможно доставить">Невозможно доставить по адресу</option>
                    <option value="Другое">Другое</option>
                  </select>
                </label>

                <div className="modal-actions" style={{ marginTop: "24px" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setCancelingOrderId(null)}
                  >
                    Закрыть
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    style={{ background: "var(--danger-main)", color: "white" }}
                    onClick={() => {
                      onStatusChange(cancelingOrderId, "cancelled", cancelReason);
                      setCancelingOrderId(null);
                      setCancelReason("Нет в наличии");
                    }}
                  >
                    Подтвердить отмену
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OrderStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`orders-stat ${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function DetailMini({
  icon,
  title,
  lines,
}: {
  icon: ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="order-detail-mini">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        {lines.map((line) => (
          <small key={line}>{line}</small>
        ))}
      </div>
    </div>
  );
}

function InspectorSection({
  icon,
  title,
  lines,
}: {
  icon: ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <section className="order-inspector-section">
      <div className="order-inspector-section-title">
        {icon}
        <strong>{title}</strong>
      </div>
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </section>
  );
}
