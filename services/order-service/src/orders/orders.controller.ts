import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrdersService, type CheckoutPayload } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Клиент вызывает этот endpoint при нажатии "Подтвердить заказ".
  @Post('orders/checkout')
  createCheckout(@Body() payload: CheckoutPayload) {
    return this.ordersService.createCheckout(payload);
  }

  // Можно проверить заказ по id, если нужно посмотреть его статус.
  @Get('orders/:orderId')
  findOrder(@Param('orderId') orderId: string) {
    return this.ordersService.findOrder(orderId);
  }

  // Сюда YooKassa присылает webhook через ngrok после оплаты или отмены платежа.
  @Post('payments/yookassa/webhook')
  handleYookassaWebhook(@Body() payload: unknown) {
    return this.ordersService.handleYookassaWebhook(payload);
  }
}
