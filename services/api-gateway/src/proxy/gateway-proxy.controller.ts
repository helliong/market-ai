import { All, Controller, Req, Res } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { GatewayProxyService } from './gateway-proxy.service';

@Controller('api')
export class GatewayProxyController {
  constructor(private readonly proxyService: GatewayProxyService) {}

  @All('auth{/*path}')
  @SkipThrottle({ default: true, public: true })
  @Throttle({ auth: {} })
  proxyAuth(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('auth', request, response);
  }

  @All('catalog/seller/products{/*path}')
  @SkipThrottle({ auth: true, public: true })
  proxySellerCatalog(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('catalog', request, response);
  }

  @All('catalog{/*path}')
  @SkipThrottle({ auth: true, default: true })
  @Throttle({ public: {} })
  proxyCatalog(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('catalog', request, response);
  }

  @All('cart{/*path}')
  @SkipThrottle({ auth: true, public: true })
  proxyCart(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('cart', request, response);
  }

  @All('order{/*path}')
  @SkipThrottle({ auth: true, public: true })
  proxyOrder(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('order', request, response);
  }

  @All('orders{/*path}')
  @SkipThrottle({ auth: true, public: true })
  proxyOrders(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('orders', request, response);
  }

  @All('storage{/*path}')
  @SkipThrottle({ auth: true, public: true })
  proxyStorage(@Req() request: Request, @Res() response: Response) {
    return this.proxyService.proxy('storage', request, response);
  }
}
