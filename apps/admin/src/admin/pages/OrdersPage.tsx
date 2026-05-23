import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, orderStatusLabel } from "../formatters";
import type { Order, OrderStatus } from "../types";

type OrdersPageProps = {
  orders: Order[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
};

export function OrdersPage({ orders, onStatusChange }: OrdersPageProps) {
  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>Orders management</h2>
          <p>Просмотр заказов и изменение статуса обработки</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Заказ</th>
              <th>Клиент</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Изменить статус</th>
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
                    <option value="new">Новый</option>
                    <option value="processing">В обработке</option>
                    <option value="completed">Завершен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
