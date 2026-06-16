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
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SellerJwtAuthGuard } from '../auth/seller-jwt-auth.guard';
import { OrdersService } from './orders.service';
import {
  CheckoutDto,
  UpdateSellerOrderStatusDto,
} from './dto/order-requests.dto';

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
  @ApiTags('Seller orders')
  @ApiCookieAuth('sellerAccessToken')
  @ApiOperation({ summary: 'List paid orders that contain current seller items' })
  @ApiOkResponse({ description: 'Orders visible to the current seller.' })
  findSellerOrders(@Req() req: AuthenticatedRequest) {
    const sellerId = req.user?.sub;
    if (!sellerId) throw new UnauthorizedException('No seller account');
    return this.ordersService.findOrdersBySeller(sellerId);
  }

  @UseGuards(SellerJwtAuthGuard)
  @Post('seller/orders/:orderId/status')
  @ApiTags('Seller orders')
  @ApiCookieAuth('sellerAccessToken')
  @ApiOperation({ summary: 'Update seller-visible order status' })
  @ApiOkResponse({ description: 'Updated order with seller items.' })
  updateSellerOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateSellerOrderStatusDto,
  ) {
    const sellerId = req.user?.sub;
    if (!sellerId) throw new UnauthorizedException('No seller account');
    return this.ordersService.updateSellerOrderStatus(
      sellerId,
      orderId,
      dto.status,
      dto.reason,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/checkout')
  @ApiTags('Buyer orders')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Create checkout order and YooKassa payment' })
  @ApiOkResponse({ description: 'Created order and payment confirmation URL.' })
  createCheckout(
    @Req() req: AuthenticatedRequest,
    @Body() payload: CheckoutDto,
  ) {
    return this.ordersService.createCheckout({
      ...payload,
      buyerId: this.getBuyerId(req),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  @ApiTags('Buyer orders')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'List current buyer orders' })
  @ApiOkResponse({ description: 'Orders created by the current buyer.' })
  findOrders(@Req() req: AuthenticatedRequest) {
    return this.ordersService.findOrdersByBuyer(this.getBuyerId(req));
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:orderId')
  @ApiTags('Buyer orders')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get current buyer order by id or public id' })
  @ApiOkResponse({ description: 'Buyer order details with items and payments.' })
  findOrder(@Req() req: AuthenticatedRequest, @Param('orderId') orderId: string) {
    return this.ordersService.findBuyerOrder(this.getBuyerId(req), orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/:orderId/cancel')
  @ApiTags('Buyer orders')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Cancel current buyer order' })
  @ApiOkResponse({ description: 'Cancelled order details.' })
  cancelOrder(
    @Req() req: AuthenticatedRequest,
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.cancelBuyerOrder(this.getBuyerId(req), orderId);
  }

  @Post('payments/yookassa/webhook')
  @ApiTags('Payments')
  @ApiOperation({ summary: 'Handle YooKassa payment webhook' })
  @ApiOkResponse({ description: 'Webhook processing result.' })
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
