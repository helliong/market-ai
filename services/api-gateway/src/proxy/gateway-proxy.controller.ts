import { All, Controller, Req, Res } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { GatewayProxyService } from './gateway-proxy.service';

@Controller('api')
export class GatewayProxyController {
  constructor(private readonly proxyService: GatewayProxyService) {}

  @All('auth{/*path}')
  @SkipThrottle({ default: true, public: true, aiPublic: true })
  @Throttle({ auth: {} })
  @ApiTags('Auth proxy')
  @ApiOperation({ summary: 'Proxy auth-service requests' })
  proxyAuth(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('auth', request, response);
  }

  @All('catalog/seller/products{/*path}')
  @SkipThrottle({ auth: true, public: true })
  @ApiTags('Catalog proxy')
  @ApiCookieAuth('sellerAccessToken')
  @ApiOperation({ summary: 'Proxy seller catalog management requests' })
  proxySellerCatalog(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('catalog', request, response);
  }

  @All('catalog{/*path}')
  @SkipThrottle({ auth: true, default: true, aiPublic: true })
  @Throttle({ public: {} })
  @ApiTags('Catalog proxy')
  @ApiOperation({ summary: 'Proxy public catalog requests' })
  proxyCatalog(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('catalog', request, response);
  }

  @All('ai{/*path}')
  @SkipThrottle({ auth: true, default: true, public: true })
  @Throttle({ aiPublic: {} })
  @ApiTags('AI proxy')
  @ApiSecurity('guestId')
  @ApiOperation({ summary: 'Proxy AI assistant requests' })
  proxyAi(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('ai', request, response);
  }

  @All('cart{/*path}')
  @SkipThrottle({ auth: true, public: true })
  @ApiTags('Shopping proxy')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Proxy cart/favorites/compare requests' })
  proxyCart(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('cart', request, response);
  }

  @All('order{/*path}')
  @SkipThrottle({ auth: true, public: true })
  @ApiTags('Order proxy')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Proxy order-service requests' })
  proxyOrder(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('order', request, response);
  }

  @All('payments{/*path}')
  @SkipThrottle({ public: true })
  @ApiTags('Payments proxy')
  @ApiOperation({ summary: 'Proxy payment webhooks' })
  proxyPayments(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('payments', request, response);
  }

  @All('orders{/*path}')
  @SkipThrottle({ auth: true, public: true })
  @ApiTags('Order proxy')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Proxy buyer orders collection requests' })
  proxyOrders(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('orders', request, response);
  }

  @All('storage{/*path}')
  @SkipThrottle({ auth: true, public: true })
  @ApiTags('Storage proxy')
  @ApiCookieAuth('sellerAccessToken')
  @ApiOperation({ summary: 'Proxy storage-service requests' })
  proxyStorage(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('storage', request, response);
  }
}
