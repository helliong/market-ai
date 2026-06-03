import { Header } from "@/components/layout/Header";
import { OrdersPage } from "@/components/orders/OrdersPage";

// Страница заказов показывает активные и завершенные покупки пользователя.
export default function Orders() {
  return (
    <main>
      <Header />
      <OrdersPage />
    </main>
  );
}
