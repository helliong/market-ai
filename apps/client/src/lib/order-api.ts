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
  grandTotal: string;
  currency: string;
  createdAt: string;
  cancelledAt?: string | null;
  completedAt?: string | null;
  items: ApiOrderItem[];
};

export async function createCheckoutOrder(payload: CheckoutOrderPayload) {
  const response = await fetch(`${ORDER_API_URL}/orders/checkout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Failed to create payment");
  }

  return data as CheckoutOrderResponse;
}

export async function fetchOrders() {
  const response = await fetch(`${ORDER_API_URL}/orders`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Failed to load orders");
  }

  return data as ApiOrder[];
}

export async function cancelOrder(orderId: string) {
  const response = await fetch(
    `${ORDER_API_URL}/orders/${encodeURIComponent(orderId)}/cancel`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Failed to cancel order");
  }

  return data as ApiOrder;
}
