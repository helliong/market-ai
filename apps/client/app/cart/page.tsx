import { Header } from "@/components/layout/Header";
import { CartPage } from "@/components/cart/CartPage";

// Страница корзины подключает экран с товарами, количеством и действиями оформления.
export default function Cart() {
  return (
    <main>
      <Header />
      <CartPage />
    </main>
  );
}
