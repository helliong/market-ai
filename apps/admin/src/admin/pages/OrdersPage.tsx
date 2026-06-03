import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, orderStatusLabel } from "../formatters";
import { useLanguage } from "../../hooks/useLanguage";
import type { Order, OrderStatus } from "../types";

type OrdersPageProps = {
  orders: Order[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
};

// Страница заказов продавца с изменением статусов заказов.
export function OrdersPage({ orders, onStatusChange }: OrdersPageProps) {
  const { t } = useLanguage();

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>{t("manageOrders")}</h2>
          <p>{t("orderDescription")}</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t("orderId")}</th>
              <th>{t("customer")}</th>
              <th>{t("amount")}</th>
              <th>{t("orderStatus")}</th>
              <th>{t("changeStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer}</td>
                <td>{formatCurrency(order.total)}</td>
                <td>
                  <StatusBadge label={orderStatusLabel(order.status)} />
                </td>
                <td>
                  <select
                    className="select-control"
                    value={order.status}
                    onChange={(event) =>
                      onStatusChange(order.id, event.target.value as OrderStatus)
                    }
                  >
                    <option value="new">{t("statusNew")}</option>
                    <option value="processing">{t("statusProcessing")}</option>
                    <option value="completed">{t("statusCompleted")}</option>
                    <option value="cancelled">{t("statusCancelled")}</option>
                  </select>
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-cell">
                  {t("noOrders")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
