import { fetchWithAuth } from "./fetch-client";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:4001";

const ORDER_API_URL =
  process.env.NEXT_PUBLIC_ORDER_API_URL ??
  AUTH_API_URL.replace(/:4001$/, ":4004");

export type CheckoutOrderItem = {
  productId: number;
  title: string;
  price: string;
  quantity: number;
};

export type CheckoutOrderPayload = {
  items: CheckoutOrderItem[];
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  delivery: {
    city: string;
    street: string;
    house: string;
    flat: string;
    comment: string;
    method: string;
  };
  payment: {
    method: string;
  };
  returnUrl: string;
};

export type CheckoutOrderResponse = {
  orderId: string;
  publicId?: string;
  paymentId: string;
  status: string;
  paymentStatus?: string;
  confirmationUrl?: string;
};

export type ApiOrderItem = {
  id: string;
  productId: number;
  sellerId: string;
  productTitleSnapshot: string;
  productPriceSnapshot: string;
  quantity: number;
  lineTotal: string;
};

export type ApiOrder = {
  id: string;
  publicId: string;
  buyerId: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  deliveryMethod?: string;
  deliveryCity?: string;
  deliveryStreet?: string;
  deliveryHouse?: string;
  deliveryFlat?: string;
  deliveryComment?: string;
  grandTotal: string;
  currency: string;
  createdAt: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  completedAt?: string | null;
  items: ApiOrderItem[];
  payments?: any[];
};

export async function createCheckoutOrder(payload: CheckoutOrderPayload) {
  return fetchWithAuth<CheckoutOrderResponse>(`${ORDER_API_URL}/orders/checkout`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchOrders() {
  return fetchWithAuth<ApiOrder[]>(`${ORDER_API_URL}/orders`);
}

export async function cancelOrder(orderId: string) {
  return fetchWithAuth<ApiOrder>(
    `${ORDER_API_URL}/orders/${encodeURIComponent(orderId)}/cancel`,
    {
      method: "POST",
    },
  );
}

export async function fetchOrder(orderId: string) {
  return fetchWithAuth<ApiOrder>(`${ORDER_API_URL}/orders/${encodeURIComponent(orderId)}`);
}
