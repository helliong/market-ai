import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ShoppingService } from './shopping.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller()
export class ShoppingController {
  constructor(private readonly shoppingService: ShoppingService) {}

  @Get('cart')
  getCart(@Req() req: AuthenticatedRequest) {
    return this.shoppingService.getCart(this.getAccountId(req));
  }

  @Post('cart/items')
  addCartItem(@Req() req: AuthenticatedRequest, @Body() dto: AddCartItemDto) {
    return this.shoppingService.addCartItem(
      this.getAccountId(req),
      dto.productId,
      dto.quantity,
    );
  }

  @Patch('cart/items/:productId')
  updateCartItem(
    @Req() req: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.shoppingService.updateCartItem(
      this.getAccountId(req),
      productId,
      dto.quantity,
    );
  }

  @Delete('cart/items/:productId')
  removeCartItem(
    @Req() req: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.shoppingService.removeCartItem(
      this.getAccountId(req),
      productId,
    );
  }

  @Delete('cart')
  clearCart(@Req() req: AuthenticatedRequest) {
    return this.shoppingService.clearCart(this.getAccountId(req));
  }

  @Get('favorites')
  getFavorites(@Req() req: AuthenticatedRequest) {
    return this.shoppingService.getFavorites(this.getAccountId(req));
  }

  @Post('favorites/:productId')
  addFavorite(
    @Req() req: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.shoppingService.addFavorite(this.getAccountId(req), productId);
  }

  @Delete('favorites/:productId')
  removeFavorite(
    @Req() req: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.shoppingService.removeFavorite(
      this.getAccountId(req),
      productId,
    );
  }

  @Get('compare')
  getCompare(@Req() req: AuthenticatedRequest) {
    return this.shoppingService.getCompare(this.getAccountId(req));
  }

  @Post('compare/:productId')
  addCompare(
    @Req() req: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.shoppingService.addCompare(this.getAccountId(req), productId);
  }

  @Delete('compare/:productId')
  removeCompare(
    @Req() req: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.shoppingService.removeCompare(
      this.getAccountId(req),
      productId,
    );
  }

  private getAccountId(req: AuthenticatedRequest) {
    const accountId = req.user?.sub;

    if (!accountId) {
      throw new UnauthorizedException('No account');
    }

    return accountId;
  }
}
