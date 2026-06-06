import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  OrderFulfillmentStatus,
  OrderPaymentProvider,
  OrderPaymentStatus,
  OrderStatus,
  OrderStatusHistoryKind,
  OrderStatusHistorySource,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { getClientUrl } from '../env';
import { PrismaService } from '../prisma/prisma.service';

export type CheckoutItem = {
  productId: number;
  sellerId?: string;
  title: string;
  price: string;
  quantity: number;
};

export type CheckoutPayload = {
  buyerId?: string;
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

type StatusTransitionOrder = {
  id: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createCheckout(payload: CheckoutPayload) {
    const items = payload.items ?? [];

    if (!items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const amount = calculateAmount(items);

    if (amount <= 0) {
      throw new BadRequestException('Order amount must be greater than zero');
    }

    const customer = normalizeCustomer(payload.customer);
    const delivery = normalizeDelivery(payload.delivery);
    const paymentMethod = payload.payment?.method?.trim() || 'card';
    const grandTotal = new Prisma.Decimal(amount.toFixed(2));

    const order = await this.prisma.$transaction((tx) =>
      tx.order.create({
        data: {
          publicId: createPublicOrderId(),
          buyerId: payload.buyerId?.trim() || customer.email || 'guest',
          status: OrderStatus.AWAITING_PAYMENT,
          paymentStatus: OrderPaymentStatus.PENDING,
          fulfillmentStatus: OrderFulfillmentStatus.NEW,
          deliveryMethod: delivery.method,
          paymentMethod,
          currency: 'RUB',
          itemsTotal: grandTotal,
          deliveryTotal: new Prisma.Decimal(0),
          discountTotal: new Prisma.Decimal(0),
          grandTotal,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          deliveryCity: delivery.city,
          deliveryStreet: delivery.street,
          deliveryHouse: delivery.house,
          deliveryFlat: delivery.flat || null,
          deliveryComment: delivery.comment || null,
          items: {
            create: items.map((item) => {
              const price = parsePrice(item.price);
              const quantity = Number.isFinite(item.quantity)
                ? item.quantity
                : 0;

              return {
                productId: item.productId,
                sellerId: item.sellerId?.trim() || 'unknown',
                productTitleSnapshot: item.title,
                productPriceSnapshot: new Prisma.Decimal(price),
                quantity,
                lineTotal: new Prisma.Decimal(price).mul(quantity),
              };
            }),
          },
          payments: {
            create: {
              provider: OrderPaymentProvider.YOOKASSA,
              status: OrderPaymentStatus.PENDING,
              amount: grandTotal,
            },
          },
          statusHistory: {
            create: [
              {
                kind: OrderStatusHistoryKind.ORDER,
                toStatus: OrderStatus.AWAITING_PAYMENT,
                source: OrderStatusHistorySource.SYSTEM,
                comment: 'Order created from checkout',
              },
              {
                kind: OrderStatusHistoryKind.PAYMENT,
                toStatus: OrderPaymentStatus.PENDING,
                source: OrderStatusHistorySource.SYSTEM,
                comment: 'Payment pending',
              },
              {
                kind: OrderStatusHistoryKind.FULFILLMENT,
                toStatus: OrderFulfillmentStatus.NEW,
                source: OrderStatusHistorySource.SYSTEM,
                comment: 'Fulfillment created',
              },
            ],
          },
        },
        include: {
          payments: true,
        },
      }),
    );

    let payment: YookassaPaymentResponse;

    try {
      payment = await this.createYookassaPayment({
        orderId: order.id,
        amount: order.grandTotal.toFixed(2),
        description: `MarketAI order ${order.publicId} (test)`,
        returnUrl:
          payload.returnUrl ??
          `${getClientUrl()}/checkout?payment=return&orderId=${order.id}`,
      });
    } catch (error) {
      await this.markPaymentCreationFailed(order.id);
      throw error;
    }

    await this.prisma.orderPayment.update({
      where: {
        id: order.payments[0].id,
      },
      data: {
        providerPaymentId: payment.id,
        rawPayload: payment as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      orderId: order.id,
      publicId: order.publicId,
      paymentId: payment.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      confirmationUrl: payment.confirmation?.confirmation_url,
    };
  }

  async findOrdersByBuyer(buyerId: string) {
    if (!buyerId.trim()) {
      throw new BadRequestException('buyerId is required');
    }

    return this.prisma.order.findMany({
      where: {
        buyerId,
      },
      include: {
        items: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOrder(orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: buildOrderLookup(orderId),
      },
      include: {
        items: true,
        payments: true,
        statusHistory: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async handleYookassaWebhook(payload: unknown) {
    const notification = payload as YookassaWebhookPayload;
    const payment = notification.object;
    const orderId = payment?.metadata?.order_id;

    if (!orderId) {
      throw new BadRequestException('YooKassa notification has no order_id');
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: {
          id: orderId,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (notification.event === 'payment.succeeded' && payment?.paid) {
        await this.applyPaidTransition(tx, order);
      } else if (notification.event === 'payment.canceled') {
        await this.applyPaymentCanceledTransition(tx, order);
      }

      if (payment?.id) {
        await tx.orderPayment.updateMany({
          where: {
            orderId: order.id,
            provider: OrderPaymentProvider.YOOKASSA,
            providerPaymentId: payment.id,
          },
          data: {
            rawPayload: notification as Prisma.InputJsonObject,
          },
        });
      }

      return tx.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },
      });
    });

    return { ok: true, orderId, status: updatedOrder.status };
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

  private async markPaymentCreationFailed(orderId: string) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: {
          id: orderId,
        },
      });

      if (!order || order.paymentStatus === OrderPaymentStatus.FAILED) {
        return;
      }

      await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: OrderPaymentStatus.FAILED,
          fulfillmentStatus: OrderFulfillmentStatus.CANCELED,
          cancelledAt: new Date(),
        },
      });

      await tx.orderPayment.updateMany({
        where: {
          orderId: order.id,
          provider: OrderPaymentProvider.YOOKASSA,
          status: OrderPaymentStatus.PENDING,
        },
        data: {
          status: OrderPaymentStatus.FAILED,
        },
      });

      await tx.orderStatusHistory.createMany({
        data: [
          {
            orderId: order.id,
            kind: OrderStatusHistoryKind.PAYMENT,
            fromStatus: order.paymentStatus,
            toStatus: OrderPaymentStatus.FAILED,
            source: OrderStatusHistorySource.SYSTEM,
            comment: 'YooKassa payment creation failed',
          },
          {
            orderId: order.id,
            kind: OrderStatusHistoryKind.ORDER,
            fromStatus: order.status,
            toStatus: OrderStatus.CANCELLED,
            source: OrderStatusHistorySource.SYSTEM,
            comment: 'Order cancelled because payment creation failed',
          },
        ],
      });
    });
  }

  private async applyPaidTransition(
    tx: Prisma.TransactionClient,
    order: StatusTransitionOrder,
  ) {
    if (order.paymentStatus === OrderPaymentStatus.PAID) {
      return;
    }

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: OrderStatus.PROCESSING,
        paymentStatus: OrderPaymentStatus.PAID,
        fulfillmentStatus: OrderFulfillmentStatus.PROCESSING,
        paidAt: new Date(),
      },
    });

    await tx.orderPayment.updateMany({
      where: {
        orderId: order.id,
        provider: OrderPaymentProvider.YOOKASSA,
      },
      data: {
        status: OrderPaymentStatus.PAID,
      },
    });

    await tx.orderStatusHistory.createMany({
      data: [
        {
          orderId: order.id,
          kind: OrderStatusHistoryKind.PAYMENT,
          fromStatus: order.paymentStatus,
          toStatus: OrderPaymentStatus.PAID,
          source: OrderStatusHistorySource.PAYMENT_PROVIDER,
          comment: 'YooKassa payment succeeded',
        },
        {
          orderId: order.id,
          kind: OrderStatusHistoryKind.ORDER,
          fromStatus: order.status,
          toStatus: OrderStatus.PROCESSING,
          source: OrderStatusHistorySource.SYSTEM,
          comment: 'Order moved to processing after payment',
        },
        {
          orderId: order.id,
          kind: OrderStatusHistoryKind.FULFILLMENT,
          fromStatus: order.fulfillmentStatus,
          toStatus: OrderFulfillmentStatus.PROCESSING,
          source: OrderStatusHistorySource.SYSTEM,
          comment: 'Fulfillment started after payment',
        },
      ],
    });
  }

  private async applyPaymentCanceledTransition(
    tx: Prisma.TransactionClient,
    order: StatusTransitionOrder,
  ) {
    if (order.paymentStatus === OrderPaymentStatus.CANCELED) {
      return;
    }

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: OrderPaymentStatus.CANCELED,
        fulfillmentStatus: OrderFulfillmentStatus.CANCELED,
        cancelledAt: new Date(),
      },
    });

    await tx.orderPayment.updateMany({
      where: {
        orderId: order.id,
        provider: OrderPaymentProvider.YOOKASSA,
      },
      data: {
        status: OrderPaymentStatus.CANCELED,
      },
    });

    await tx.orderStatusHistory.createMany({
      data: [
        {
          orderId: order.id,
          kind: OrderStatusHistoryKind.PAYMENT,
          fromStatus: order.paymentStatus,
          toStatus: OrderPaymentStatus.CANCELED,
          source: OrderStatusHistorySource.PAYMENT_PROVIDER,
          comment: 'YooKassa payment canceled',
        },
        {
          orderId: order.id,
          kind: OrderStatusHistoryKind.ORDER,
          fromStatus: order.status,
          toStatus: OrderStatus.CANCELLED,
          source: OrderStatusHistorySource.SYSTEM,
          comment: 'Order cancelled after payment cancellation',
        },
        {
          orderId: order.id,
          kind: OrderStatusHistoryKind.FULFILLMENT,
          fromStatus: order.fulfillmentStatus,
          toStatus: OrderFulfillmentStatus.CANCELED,
          source: OrderStatusHistorySource.SYSTEM,
          comment: 'Fulfillment canceled',
        },
      ],
    });
  }
}

function calculateAmount(items: CheckoutItem[]) {
  return items.reduce((sum, item) => {
    const price = parsePrice(item.price);
    const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
    return sum + price * quantity;
  }, 0);
}

function parsePrice(price: string) {
  return Number(price.replace(/[^\d]/g, ''));
}

function normalizeCustomer(customer: CheckoutPayload['customer']) {
  const name = customer?.name?.trim();
  const phone = customer?.phone?.trim();
  const email = customer?.email?.trim();

  if (!name || !phone || !email) {
    throw new BadRequestException('Customer name, phone and email are required');
  }

  return { name, phone, email };
}

function normalizeDelivery(delivery: CheckoutPayload['delivery']) {
  const city = delivery?.city?.trim();
  const street = delivery?.street?.trim();
  const house = delivery?.house?.trim();

  if (!city || !street || !house) {
    throw new BadRequestException('Delivery city, street and house are required');
  }

  return {
    city,
    street,
    house,
    flat: delivery?.flat?.trim() ?? '',
    comment: delivery?.comment?.trim() ?? '',
    method: delivery?.method?.trim() || 'courier',
  };
}

function createPublicOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `MA-${date}-${suffix}`;
}

function buildOrderLookup(orderId: string) {
  const lookup: Array<{ id?: string; publicId?: string }> = [
    { publicId: orderId },
  ];

  if (isUuid(orderId)) {
    lookup.push({ id: orderId });
  }

  return lookup;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
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
