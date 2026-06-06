import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { OrdersPage } from "@/components/orders/OrdersPage";

// Страница заказов показывает активные и завершенные покупки пользователя.
export default function Orders() {
  return (
    <main>
      <Header />
      <Suspense fallback={null}>
        <OrdersPage />
      </Suspense>
    </main>
  );
}
