import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { OrdersService, type CheckoutPayload } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders/checkout')
  createCheckout(@Body() payload: CheckoutPayload) {
    return this.ordersService.createCheckout(payload);
  }

  @Get('orders')
  findOrders(@Query('buyerId') buyerId = '') {
    return this.ordersService.findOrdersByBuyer(buyerId);
  }

  @Get('orders/:orderId')
  findOrder(@Param('orderId') orderId: string) {
    return this.ordersService.findOrder(orderId);
  }

  @Post('payments/yookassa/webhook')
  handleYookassaWebhook(@Body() payload: unknown) {
    return this.ordersService.handleYookassaWebhook(payload);
  }
}
