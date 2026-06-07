import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SellerJwtAuthGuard } from '../auth/seller-jwt-auth.guard';
import { OrdersService, type CheckoutPayload } from './orders.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
  };
};

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(SellerJwtAuthGuard)
  @Get('seller/orders')
  findSellerOrders(@Req() req: AuthenticatedRequest) {
    const sellerId = req.user?.sub;
    if (!sellerId) throw new UnauthorizedException('No seller account');
    return this.ordersService.findOrdersBySeller(sellerId);
  }

  @UseGuards(SellerJwtAuthGuard)
  @Post('seller/orders/:orderId/status')
  updateSellerOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('orderId') orderId: string,
    @Body('status') status: string,
    @Body('reason') reason?: string,
  ) {
    const sellerId = req.user?.sub;
    if (!sellerId) throw new UnauthorizedException('No seller account');
    return this.ordersService.updateSellerOrderStatus(sellerId, orderId, status, reason);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/checkout')
  createCheckout(
    @Req() req: AuthenticatedRequest,
    @Body() payload: CheckoutPayload,
  ) {
    return this.ordersService.createCheckout({
      ...payload,
      buyerId: this.getBuyerId(req),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  findOrders(@Req() req: AuthenticatedRequest) {
    return this.ordersService.findOrdersByBuyer(this.getBuyerId(req));
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:orderId')
  findOrder(@Req() req: AuthenticatedRequest, @Param('orderId') orderId: string) {
    return this.ordersService.findBuyerOrder(this.getBuyerId(req), orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/:orderId/cancel')
  cancelOrder(
    @Req() req: AuthenticatedRequest,
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.cancelBuyerOrder(this.getBuyerId(req), orderId);
  }

  @Post('payments/yookassa/webhook')
  handleYookassaWebhook(@Body() payload: unknown) {
    return this.ordersService.handleYookassaWebhook(payload);
  }

  private getBuyerId(req: AuthenticatedRequest) {
    const buyerId = req.user?.sub;

    if (!buyerId) {
      throw new UnauthorizedException('No buyer account');
    }

    return buyerId;
  }
}
