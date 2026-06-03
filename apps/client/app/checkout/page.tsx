import { Suspense } from "react";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { Header } from "@/components/layout/Header";

// Страница оформления заказа показывает форму доставки, оплаты и итоговую сумму.
export default function Checkout() {
  return (
    <main>
      <Header />
      <Suspense fallback={null}>
        <CheckoutPage />
      </Suspense>
    </main>
  );
}
