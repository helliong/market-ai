import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { getClientUrl } from '../env';

export type CheckoutItem = {
  productId: number;
  title: string;
  price: string;
  quantity: number;
};

export type CheckoutPayload = {
  items?: CheckoutItem[];
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  delivery?: {
    city?: string;
    street?: string;
    house?: string;
    flat?: string;
    comment?: string;
    method?: string;
  };
  payment?: {
    method?: string;
  };
  returnUrl?: string;
};

type StoredOrder = {
  id: string;
  paymentId?: string;
  status: 'payment_pending' | 'paid' | 'payment_canceled';
  amount: string;
  items: CheckoutItem[];
  createdAt: string;
};

type YookassaPaymentResponse = {
  id: string;
  status: string;
  paid: boolean;
  confirmation?: {
    confirmation_url?: string;
  };
};

type YookassaWebhookPayload = {
  event?: string;
  object?: {
    id?: string;
    status?: string;
    paid?: boolean;
    metadata?: {
      order_id?: string;
    };
  };
};

@Injectable()
export class OrdersService {
  private readonly orders = new Map<string, StoredOrder>();

  async createCheckout(payload: CheckoutPayload) {
    const items = payload.items ?? [];

    if (!items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const amount = calculateAmount(items);

    if (amount <= 0) {
      throw new BadRequestException('Order amount must be greater than zero');
    }

    const orderId = randomUUID();
    const order: StoredOrder = {
      id: orderId,
      status: 'payment_pending',
      amount: amount.toFixed(2),
      items,
      createdAt: new Date().toISOString(),
    };

    this.orders.set(orderId, order);

    const payment = await this.createYookassaPayment({
      orderId,
      amount: order.amount,
      description: `MarketAI order ${orderId.slice(0, 8)} (test)`,
      returnUrl:
        payload.returnUrl ??
        `${getClientUrl()}/checkout?payment=return&orderId=${orderId}`,
    });

    order.paymentId = payment.id;
    this.orders.set(orderId, order);

    return {
      orderId,
      paymentId: payment.id,
      status: order.status,
      confirmationUrl: payment.confirmation?.confirmation_url,
    };
  }

  findOrder(orderId: string) {
    const order = this.orders.get(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  handleYookassaWebhook(payload: unknown) {
    const notification = payload as YookassaWebhookPayload;
    const payment = notification.object;
    const orderId = payment?.metadata?.order_id;

    if (!orderId) {
      throw new BadRequestException('YooKassa notification has no order_id');
    }

    const order = this.orders.get(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (notification.event === 'payment.succeeded' && payment?.paid) {
      order.status = 'paid';
    } else if (notification.event === 'payment.canceled') {
      order.status = 'payment_canceled';
    }

    this.orders.set(orderId, order);

    return { ok: true, orderId, status: order.status };
  }

  private async createYookassaPayment(input: {
    orderId: string;
    amount: string;
    description: string;
    returnUrl: string;
  }) {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const apiKey = process.env.YOOKASSA_API_KEY;

    if (!shopId || !apiKey) {
      throw new ServiceUnavailableException('YooKassa credentials are missing');
    }

    let response: Response;

    try {
      response = await retry(() =>
        fetch('https://api.yookassa.ru/v3/payments', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${shopId}:${apiKey}`).toString('base64')}`,
            'Content-Type': 'application/json',
            'Idempotence-Key': randomUUID(),
          },
          body: JSON.stringify({
            amount: {
              value: input.amount,
              currency: 'RUB',
            },
            capture: true,
            confirmation: {
              type: 'redirect',
              return_url: input.returnUrl,
            },
            description: input.description,
            metadata: {
              order_id: input.orderId,
            },
          }),
        }),
      );
    } catch {
      throw new ServiceUnavailableException(
        'YooKassa API is temporarily unavailable. Please try again.',
      );
    }

    const data = (await response.json().catch(() => null)) as
      | YookassaPaymentResponse
      | { description?: string }
      | null;

    if (!response.ok) {
      const message =
        data && 'description' in data && data.description
          ? data.description
          : 'Failed to create YooKassa payment';
      throw new ServiceUnavailableException(message);
    }

    return data as YookassaPaymentResponse;
  }
}

function calculateAmount(items: CheckoutItem[]) {
  return items.reduce((sum, item) => {
    const price = Number(item.price.replace(/[^\d]/g, ''));
    const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
    return sum + price * quantity;
  }, 0);
}

async function retry<T>(action: () => Promise<T>, attempts = 2) {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
