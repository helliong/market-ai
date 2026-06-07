import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  OrderPaymentProvider,
  OrderStatus,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
} from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      orderPayment: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      orderStatusHistory: {
        createMany: jest.fn(),
      },
    };
    mockPrisma['$transaction'] = jest.fn((cb) => cb(mockPrisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('handleYookassaWebhook', () => {
    const mockOrderId = 'order-123';
    const mockPaymentId = 'payment-456';
    const mockProviderPaymentId = 'yookassa-789';

    const getBasePayload = (event: string, paid = false) => ({
      event,
      object: {
        id: mockProviderPaymentId,
        status: paid ? 'succeeded' : 'pending',
        paid,
        metadata: {
          order_id: mockOrderId,
        },
      },
    });

    const mockOrderPayment = {
      id: mockPaymentId,
      orderId: mockOrderId,
      provider: OrderPaymentProvider.YOOKASSA,
      providerPaymentId: mockProviderPaymentId,
      status: OrderPaymentStatus.PENDING,
    };

    const mockOrder = {
      id: mockOrderId,
      status: OrderStatus.AWAITING_PAYMENT,
      paymentStatus: OrderPaymentStatus.PENDING,
      fulfillmentStatus: OrderFulfillmentStatus.PROCESSING,
    };

    it('should throw BadRequestException if provider_payment_id is missing', async () => {
      const payload = {
        event: 'payment.succeeded',
        object: {},
      };

      await expect(service.handleYookassaWebhook(payload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if orderPayment is not found', async () => {
      prisma.orderPayment.findUnique.mockResolvedValueOnce(null);

      const payload = getBasePayload('payment.succeeded', true);

      await expect(service.handleYookassaWebhook(payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if order_id metadata mismatches', async () => {
      prisma.orderPayment.findUnique.mockResolvedValueOnce({
        ...mockOrderPayment,
        orderId: 'different-order-id',
      });

      const payload = getBasePayload('payment.succeeded', true);

      await expect(service.handleYookassaWebhook(payload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully transition pending -> paid', async () => {
      prisma.orderPayment.findUnique.mockResolvedValueOnce(mockOrderPayment);
      prisma.order.findUnique.mockResolvedValueOnce(mockOrder);
      prisma.order.findUniqueOrThrow.mockResolvedValueOnce({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
        paymentStatus: OrderPaymentStatus.PAID,
      });

      const payload = getBasePayload('payment.succeeded', true);

      const result = await service.handleYookassaWebhook(payload);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: expect.objectContaining({
          status: OrderStatus.PROCESSING,
          paymentStatus: OrderPaymentStatus.PAID,
          fulfillmentStatus: OrderFulfillmentStatus.PROCESSING,
        }),
      });

      expect(prisma.orderPayment.updateMany).toHaveBeenCalledWith({
        where: {
          orderId: mockOrderId,
          provider: OrderPaymentProvider.YOOKASSA,
        },
        data: {
          status: OrderPaymentStatus.PAID,
        },
      });

      expect(prisma.orderPayment.update).toHaveBeenCalledWith({
        where: { id: mockPaymentId },
        data: {
          rawPayload: payload,
        },
      });

      expect(prisma.orderStatusHistory.createMany).toHaveBeenCalled();
      expect(result.status).toBe(OrderStatus.PROCESSING);
    });

    it('should successfully transition pending -> canceled', async () => {
      prisma.orderPayment.findUnique.mockResolvedValueOnce(mockOrderPayment);
      prisma.order.findUnique.mockResolvedValueOnce(mockOrder);
      prisma.order.findUniqueOrThrow.mockResolvedValueOnce({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      const payload = getBasePayload('payment.canceled', false);

      const result = await service.handleYookassaWebhook(payload);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: expect.objectContaining({
          status: OrderStatus.CANCELLED,
          paymentStatus: OrderPaymentStatus.CANCELED,
          fulfillmentStatus: OrderFulfillmentStatus.CANCELED,
        }),
      });

      expect(prisma.orderPayment.updateMany).toHaveBeenCalledWith({
        where: {
          orderId: mockOrderId,
          provider: OrderPaymentProvider.YOOKASSA,
        },
        data: {
          status: OrderPaymentStatus.CANCELED,
        },
      });

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should be idempotent: do not duplicate transitions on repeated paid webhook', async () => {
      prisma.orderPayment.findUnique.mockResolvedValueOnce(mockOrderPayment);
      // Order is already paid
      prisma.order.findUnique.mockResolvedValueOnce({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
        paymentStatus: OrderPaymentStatus.PAID,
      });
      prisma.order.findUniqueOrThrow.mockResolvedValueOnce({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
      });

      const payload = getBasePayload('payment.succeeded', true);

      await service.handleYookassaWebhook(payload);

      // It should NOT update order status again
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(prisma.orderPayment.updateMany).not.toHaveBeenCalled();
      expect(prisma.orderStatusHistory.createMany).not.toHaveBeenCalled();

      // It SHOULD still update rawPayload
      expect(prisma.orderPayment.update).toHaveBeenCalledWith({
        where: { id: mockPaymentId },
        data: {
          rawPayload: payload,
        },
      });
    });
  });
});
