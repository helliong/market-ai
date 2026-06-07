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
import { getCatalogServiceUrl, getClientUrl } from '../env';
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

type CatalogProductResponse = {
  id: number;
  sellerId: string;
  name: string;
  price: number | string;
};

type ResolvedCheckoutItem = {
  productId: number;
  sellerId: string;
  title: string;
  price: Prisma.Decimal;
  quantity: number;
  lineTotal: Prisma.Decimal;
};

type CatalogStockMutationItem = {
  productId: number;
  quantity: number;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createCheckout(payload: CheckoutPayload) {
    const items = payload.items ?? [];

    if (!items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const resolvedItems = await this.resolveCheckoutItems(items);
    const grandTotal = resolvedItems.reduce(
      (sum, item) => sum.add(item.lineTotal),
      new Prisma.Decimal(0),
    );

    const customer = normalizeCustomer(payload.customer);
    const delivery = normalizeDelivery(payload.delivery);
    const buyerId = normalizeBuyerId(payload.buyerId);
    const paymentMethod = payload.payment?.method?.trim() || 'card';
    const stockItems = buildCatalogStockMutationItems(resolvedItems);

    await this.reserveCatalogStock(stockItems);

    let order: Awaited<ReturnType<typeof this.createOrder>>;

    try {
      order = await this.createOrder({
        buyerId,
        customer,
        delivery,
        grandTotal,
        paymentMethod,
        resolvedItems,
      });
    } catch (error) {
      await this.releaseCatalogStock(stockItems).catch(() => undefined);
      throw error;
    }

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
      await this.releaseCatalogStock(stockItems).catch(() => undefined);
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

  private createOrder(input: {
    buyerId: string;
    customer: ReturnType<typeof normalizeCustomer>;
    delivery: ReturnType<typeof normalizeDelivery>;
    grandTotal: Prisma.Decimal;
    paymentMethod: string;
    resolvedItems: ResolvedCheckoutItem[];
  }) {
    return this.prisma.$transaction((tx) =>
      tx.order.create({
        data: {
          publicId: createPublicOrderId(),
          buyerId: input.buyerId,
          status: OrderStatus.AWAITING_PAYMENT,
          paymentStatus: OrderPaymentStatus.PENDING,
          fulfillmentStatus: OrderFulfillmentStatus.PROCESSING,
          deliveryMethod: input.delivery.method,
          paymentMethod: input.paymentMethod,
          currency: 'RUB',
          itemsTotal: input.grandTotal,
          deliveryTotal: new Prisma.Decimal(0),
          discountTotal: new Prisma.Decimal(0),
          grandTotal: input.grandTotal,
          customerName: input.customer.name,
          customerPhone: input.customer.phone,
          customerEmail: input.customer.email,
          deliveryCity: input.delivery.city,
          deliveryStreet: input.delivery.street,
          deliveryHouse: input.delivery.house,
          deliveryFlat: input.delivery.flat || null,
          deliveryComment: input.delivery.comment || null,
          items: {
            create: input.resolvedItems.map((item) => ({
              productId: item.productId,
              sellerId: item.sellerId,
              productTitleSnapshot: item.title,
              productPriceSnapshot: item.price,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
          },
          payments: {
            create: {
              provider: OrderPaymentProvider.YOOKASSA,
              status: OrderPaymentStatus.PENDING,
              amount: input.grandTotal,
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
                toStatus: OrderFulfillmentStatus.PROCESSING,
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

  async findOrdersBySeller(sellerId: string) {
    if (!sellerId.trim()) {
      throw new BadRequestException('sellerId is required');
    }

    const orders = await this.prisma.order.findMany({
      where: {
        items: {
          some: {
            sellerId,
          },
        },
        paymentStatus: {
          in: ['PAID', 'REFUNDED'],
        },
      },
      include: {
        items: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => ({
      ...order,
      items: order.items.filter((item) => item.sellerId === sellerId),
    }));
  }

  async updateSellerOrderStatus(
    sellerId: string,
    orderId: string,
    targetStatus: string,
    reason?: string,
  ) {
    if (!sellerId.trim() || !orderId.trim()) {
      throw new BadRequestException('sellerId and orderId are required');
    }

    const order = await this.prisma.order.findFirst({
      where: {
        OR: buildOrderLookup(orderId),
        items: {
          some: {
            sellerId,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or access denied');
    }

    let newStatus = order.status;
    let newFulfillmentStatus = order.fulfillmentStatus;

    if (targetStatus === 'completed') {
      newStatus = OrderStatus.COMPLETED;
      newFulfillmentStatus = OrderFulfillmentStatus.RECEIVED;
    } else if (targetStatus === 'cancelled') {
      newStatus = OrderStatus.CANCELLED;
      newFulfillmentStatus = OrderFulfillmentStatus.CANCELED;
    }

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        fulfillmentStatus: newFulfillmentStatus,
        ...(reason && targetStatus === 'cancelled'
          ? { cancellationReason: reason }
          : {}),
      },
      include: {
        items: true,
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

  async findBuyerOrder(buyerId: string, orderId: string) {
    const orderLookup = await buildBuyerOrderLookup(
      this.prisma,
      buyerId,
      orderId,
    );
    const order = await this.prisma.order.findFirst({
      where: {
        buyerId,
        OR: orderLookup,
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

  async cancelBuyerOrder(buyerId: string, orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const orderLookup = await buildBuyerOrderLookup(tx, buyerId, orderId);
      const order = await tx.order.findFirst({
        where: {
          buyerId,
          OR: orderLookup,
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

      if (order.status === OrderStatus.CANCELLED) {
        return order;
      }

      if (order.status === OrderStatus.COMPLETED) {
        throw new BadRequestException('Completed order cannot be cancelled');
      }

      const nextPaymentStatus =
        order.paymentStatus === OrderPaymentStatus.PENDING
          ? OrderPaymentStatus.CANCELED
          : order.paymentStatus;

      const updatedOrder = await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: nextPaymentStatus,
          fulfillmentStatus: OrderFulfillmentStatus.CANCELED,
          cancelledAt: new Date(),
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

      if (nextPaymentStatus === OrderPaymentStatus.CANCELED) {
        await tx.orderPayment.updateMany({
          where: {
            orderId: order.id,
            status: OrderPaymentStatus.PENDING,
          },
          data: {
            status: OrderPaymentStatus.CANCELED,
          },
        });
      }

      const historyRows: Prisma.OrderStatusHistoryCreateManyInput[] = [
        {
          orderId: order.id,
          kind: OrderStatusHistoryKind.ORDER,
          fromStatus: order.status,
          toStatus: OrderStatus.CANCELLED,
          source: OrderStatusHistorySource.BUYER,
          comment: 'Buyer cancelled order',
        },
        {
          orderId: order.id,
          kind: OrderStatusHistoryKind.FULFILLMENT,
          fromStatus: order.fulfillmentStatus,
          toStatus: OrderFulfillmentStatus.CANCELED,
          source: OrderStatusHistorySource.BUYER,
          comment: 'Buyer cancelled fulfillment',
        },
      ];

      if (nextPaymentStatus !== order.paymentStatus) {
        historyRows.push({
          orderId: order.id,
          kind: OrderStatusHistoryKind.PAYMENT,
          fromStatus: order.paymentStatus,
          toStatus: nextPaymentStatus,
          source: OrderStatusHistorySource.BUYER,
          comment: 'Pending payment cancelled by buyer',
        });
      }

      await tx.orderStatusHistory.createMany({
        data: historyRows,
      });

      return updatedOrder;
    });
  }

  async handleYookassaWebhook(payload: unknown) {
    const notification = payload as YookassaWebhookPayload;
    const payment = notification.object;
    const providerPaymentId = payment?.id;

    if (!providerPaymentId) {
      throw new BadRequestException('YooKassa notification has no payment id');
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const orderPayment = await tx.orderPayment.findUnique({
        where: {
          provider_providerPaymentId: {
            provider: OrderPaymentProvider.YOOKASSA,
            providerPaymentId,
          },
        },
      });

      if (!orderPayment) {
        throw new NotFoundException('YooKassa payment not found in system');
      }

      const orderId = payment?.metadata?.order_id;
      if (orderId && orderPayment.orderId !== orderId) {
        throw new BadRequestException('Payment order_id metadata mismatch');
      }

      const order = await tx.order.findUnique({
        where: {
          id: orderPayment.orderId,
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

      await tx.orderPayment.update({
        where: {
          id: orderPayment.id,
        },
        data: {
          rawPayload: notification as Prisma.InputJsonObject,
        },
      });

      return tx.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },
      });
    });

    return { ok: true, orderId: updatedOrder.id, status: updatedOrder.status };
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

  private reserveCatalogStock(items: CatalogStockMutationItem[]) {
    return this.mutateCatalogStock('reserve', items);
  }

  private releaseCatalogStock(items: CatalogStockMutationItem[]) {
    return this.mutateCatalogStock('release', items);
  }

  private async mutateCatalogStock(
    action: 'reserve' | 'release',
    items: CatalogStockMutationItem[],
  ) {
    const catalogUrl = getCatalogServiceUrl().replace(/\/$/, '');
    let response: Response;

    try {
      response = await retry(() =>
        fetch(`${catalogUrl}/internal/products/stock/${action}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items }),
        }),
      );
    } catch {
      throw new ServiceUnavailableException(
        'Catalog stock service is temporarily unavailable. Please try again.',
      );
    }

    const data = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;

    if (!response.ok) {
      const message =
        data?.message && Array.isArray(data.message)
          ? data.message.join(', ')
          : data?.message;
      throw new BadRequestException(message ?? 'Product stock is unavailable');
    }
  }

  private async resolveCheckoutItems(items: CheckoutItem[]) {
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        const quantity = normalizeQuantity(item.quantity);
        const product = await this.fetchCatalogProduct(item.productId);
        const price = normalizeCatalogPrice(product.price);

        return {
          productId: product.id,
          sellerId: product.sellerId,
          title: product.name,
          price,
          quantity,
          lineTotal: price.mul(quantity),
        };
      }),
    );

    const grandTotal = resolvedItems.reduce(
      (sum, item) => sum.add(item.lineTotal),
      new Prisma.Decimal(0),
    );

    if (grandTotal.lte(0)) {
      throw new BadRequestException('Order amount must be greater than zero');
    }

    return resolvedItems;
  }

  private async fetchCatalogProduct(productId: number) {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new BadRequestException('Invalid product id');
    }

    const catalogUrl = getCatalogServiceUrl().replace(/\/$/, '');
    let response: Response;

    try {
      response = await retry(() =>
        fetch(`${catalogUrl}/products/${productId}`, {
          method: 'GET',
        }),
      );
    } catch {
      throw new ServiceUnavailableException(
        'Catalog service is temporarily unavailable. Please try again.',
      );
    }

    const data = (await response.json().catch(() => null)) as
      | CatalogProductResponse
      | { message?: string }
      | null;

    if (!response.ok) {
      const message =
        data && 'message' in data && data.message
          ? data.message
          : 'Product is not available';
      throw new BadRequestException(message);
    }

    if (!isCatalogProduct(data)) {
      throw new ServiceUnavailableException('Catalog returned invalid product');
    }

    return data;
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

function normalizeCustomer(customer: CheckoutPayload['customer']) {
  const name = customer?.name?.trim();
  const phone = customer?.phone?.trim();
  const email = customer?.email?.trim();

  if (!name || !phone || !email) {
    throw new BadRequestException(
      'Customer name, phone and email are required',
    );
  }

  return { name, phone, email };
}

function normalizeBuyerId(buyerId?: string) {
  const normalizedBuyerId = buyerId?.trim();

  if (!normalizedBuyerId) {
    throw new BadRequestException('Buyer account is required');
  }

  return normalizedBuyerId;
}

function normalizeQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new BadRequestException('Item quantity must be greater than zero');
  }

  return quantity;
}

function normalizeCatalogPrice(price: number | string) {
  const decimal = new Prisma.Decimal(price);

  if (decimal.lte(0)) {
    throw new BadRequestException('Product price must be greater than zero');
  }

  return decimal;
}

function buildCatalogStockMutationItems(items: ResolvedCheckoutItem[]) {
  const quantitiesByProductId = new Map<number, number>();

  for (const item of items) {
    quantitiesByProductId.set(
      item.productId,
      (quantitiesByProductId.get(item.productId) ?? 0) + item.quantity,
    );
  }

  return [...quantitiesByProductId.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

function isCatalogProduct(
  product: CatalogProductResponse | { message?: string } | null,
): product is CatalogProductResponse {
  return Boolean(
    product &&
    typeof product === 'object' &&
    typeof (product as CatalogProductResponse).id === 'number' &&
    typeof (product as CatalogProductResponse).sellerId === 'string' &&
    (product as CatalogProductResponse).sellerId.trim() &&
    typeof (product as CatalogProductResponse).name === 'string' &&
    (typeof (product as CatalogProductResponse).price === 'number' ||
      typeof (product as CatalogProductResponse).price === 'string'),
  );
}

function normalizeDelivery(delivery: CheckoutPayload['delivery']) {
  const city = delivery?.city?.trim();
  const street = delivery?.street?.trim();
  const house = delivery?.house?.trim();

  if (!city || !street || !house) {
    throw new BadRequestException(
      'Delivery city, street and house are required',
    );
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

function buildOrderLookup(orderId: string): Prisma.OrderWhereInput[] {
  const lookup: Prisma.OrderWhereInput[] = [{ publicId: orderId }];

  if (isUuid(orderId)) {
    lookup.push({ id: orderId });
  }

  return lookup;
}

async function buildBuyerOrderLookup(
  client: Pick<Prisma.TransactionClient, '$queryRaw'>,
  buyerId: string,
  orderId: string,
) {
  const lookup = buildOrderLookup(orderId);

  if (!isUuidPrefix(orderId)) {
    return lookup;
  }

  const prefix = `${orderId.toLowerCase()}%`;
  const rows = await client.$queryRaw<Array<{ id: string }>>`
    SELECT id::text AS id
    FROM "orders"
    WHERE "buyer_id" = ${buyerId}
      AND id::text LIKE ${prefix}
    LIMIT 1
  `;

  if (rows[0]?.id) {
    lookup.push({ id: rows[0].id });
  }

  return lookup;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isUuidPrefix(value: string) {
  return /^[0-9a-f]{8}$/i.test(value);
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
