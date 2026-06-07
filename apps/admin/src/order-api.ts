import { refreshSellerSession } from "./auth-api";

const ORDER_API_URL = import.meta.env.VITE_ORDER_API_URL ?? "http://127.0.0.1:4004";

export type OrderItem = {
  id: string;
  orderId: string;
  productId: number;
  sellerId: string;
  productTitleSnapshot: string;
  productPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  publicId: string;
  buyerId: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  deliveryMethod: string;
  paymentMethod: string;
  currency: string;
  itemsTotal: number;
  deliveryTotal: number;
  discountTotal: number;
  grandTotal: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryCity: string;
  deliveryStreet: string;
  deliveryHouse: string;
  deliveryFlat: string | null;
  deliveryComment: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  cancellationReason?: string | null;
  completedAt: string | null;
  items: OrderItem[];
};

async function orderRequest<T>(
  path: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<T> {
  const response = await fetch(`${ORDER_API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && retryOnUnauthorized) {
      await refreshSellerSession();
      return orderRequest<T>(path, options, false);
    }
    throw new Error(data?.message ?? "Order request failed");
  }

  return data as T;
}

export function getSellerOrders() {
  return orderRequest<Order[]>("/seller/orders");
}

export function updateSellerOrderStatus(orderId: string, status: string, reason?: string) {
  return orderRequest<Order>(`/seller/orders/${encodeURIComponent(orderId)}/status`, {
    method: "POST",
    body: JSON.stringify({ status, reason }),
  });
}
