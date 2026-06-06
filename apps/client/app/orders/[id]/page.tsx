import { OrderDetailPage } from "@/components/orders/OrderDetailPage";
import { Header } from "@/components/layout/Header";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <main>
      <Header />
      <OrderDetailPage orderId={resolvedParams.id} />
    </main>
  );
}
