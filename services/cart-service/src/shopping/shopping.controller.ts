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
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import {
  CartResponseDto,
  CompareResponseDto,
  IdsResponseDto,
} from './dto/shopping-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ShoppingService } from './shopping.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller()
@ApiTags('Shopping state')
@ApiCookieAuth('accessToken')
@ApiUnauthorizedResponse({
  description:
    'Missing, expired or invalid buyer accessToken cookie. Login through auth-service first.',
})
export class ShoppingController {
  constructor(private readonly shoppingService: ShoppingService) {}

  @Get('cart')
  @ApiOperation({
    summary: 'Get buyer cart',
    description:
      'Returns the persisted cart for the current buyer account. The service stores productId and quantity only; product details are resolved by the client or catalog service.',
  })
  @ApiOkResponse({
    type: CartResponseDto,
    description: 'Current buyer cart.',
  })
  getCart(@Req() req: AuthenticatedRequest) {
    return this.shoppingService.getCart(this.getAccountId(req));
  }

  @Post('cart/items')
  @ApiOperation({
    summary: 'Add product to cart',
    description:
      'Adds a product to the current buyer cart. If the product is already in the cart, its quantity is incremented.',
  })
  @ApiBody({ type: AddCartItemDto })
  @ApiOkResponse({
    type: CartResponseDto,
    description: 'Updated buyer cart.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid productId or quantity.',
  })
  addCartItem(@Req() req: AuthenticatedRequest, @Body() dto: AddCartItemDto) {
    return this.shoppingService.addCartItem(
      this.getAccountId(req),
      dto.productId,
      dto.quantity,
    );
  }

  @Patch('cart/items/:productId')
  @ApiOperation({
    summary: 'Set cart item quantity',
    description:
      'Sets the final quantity for a product in the current buyer cart. If the item does not exist yet, it is created with the provided quantity.',
  })
  @ApiParam({
    name: 'productId',
    example: 8,
    description: 'Product identifier from the catalog.',
  })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiOkResponse({
    type: CartResponseDto,
    description: 'Updated buyer cart.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid productId or quantity.',
  })
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
  @ApiOperation({
    summary: 'Remove product from cart',
    description: 'Removes one product from the current buyer cart.',
  })
  @ApiParam({
    name: 'productId',
    example: 8,
    description: 'Product identifier from the catalog.',
  })
  @ApiOkResponse({
    type: CartResponseDto,
    description: 'Updated buyer cart.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid productId.',
  })
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
  @ApiOperation({
    summary: 'Clear buyer cart',
    description: 'Removes all products from the current buyer cart.',
  })
  @ApiOkResponse({
    type: CartResponseDto,
    description: 'Empty buyer cart.',
  })
  clearCart(@Req() req: AuthenticatedRequest) {
    return this.shoppingService.clearCart(this.getAccountId(req));
  }

  @Get('favorites')
  @ApiOperation({
    summary: 'Get favorite products',
    description:
      'Returns product ids saved to favorites by the current buyer account.',
  })
  @ApiOkResponse({
    type: IdsResponseDto,
    description: 'Current favorite product ids.',
  })
  getFavorites(@Req() req: AuthenticatedRequest) {
    return this.shoppingService.getFavorites(this.getAccountId(req));
  }

  @Post('favorites/:productId')
  @ApiOperation({
    summary: 'Add product to favorites',
    description:
      'Adds a product to current buyer favorites. The operation is idempotent.',
  })
  @ApiParam({
    name: 'productId',
    example: 8,
    description: 'Product identifier from the catalog.',
  })
  @ApiOkResponse({
    type: IdsResponseDto,
    description: 'Updated favorite product ids.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid productId.',
  })
  addFavorite(
    @Req() req: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.shoppingService.addFavorite(this.getAccountId(req), productId);
  }

  @Delete('favorites/:productId')
  @ApiOperation({
    summary: 'Remove product from favorites',
    description: 'Removes a product from current buyer favorites.',
  })
  @ApiParam({
    name: 'productId',
    example: 8,
    description: 'Product identifier from the catalog.',
  })
  @ApiOkResponse({
    type: IdsResponseDto,
    description: 'Updated favorite product ids.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid productId.',
  })
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
  @ApiOperation({
    summary: 'Get compare list',
    description:
      'Returns product ids added to comparison by the current buyer account. Compare list is capped to six products.',
  })
  @ApiOkResponse({
    type: CompareResponseDto,
    description: 'Current compare product ids and limit.',
  })
  getCompare(@Req() req: AuthenticatedRequest) {
    return this.shoppingService.getCompare(this.getAccountId(req));
  }

  @Post('compare/:productId')
  @ApiOperation({
    summary: 'Add product to compare list',
    description:
      'Adds a product to comparison. The operation is idempotent for existing products and rejects new products when the compare limit is reached.',
  })
  @ApiParam({
    name: 'productId',
    example: 8,
    description: 'Product identifier from the catalog.',
  })
  @ApiOkResponse({
    type: CompareResponseDto,
    description: 'Updated compare product ids and limit.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid productId or compare limit reached.',
  })
  addCompare(
    @Req() req: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.shoppingService.addCompare(this.getAccountId(req), productId);
  }

  @Delete('compare/:productId')
  @ApiOperation({
    summary: 'Remove product from compare list',
    description: 'Removes a product from current buyer comparison list.',
  })
  @ApiParam({
    name: 'productId',
    example: 8,
    description: 'Product identifier from the catalog.',
  })
  @ApiOkResponse({
    type: CompareResponseDto,
    description: 'Updated compare product ids and limit.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid productId.',
  })
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
