import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { createProxyMiddleware, type RequestHandler } from 'http-proxy-middleware';

type ServiceKey = 'auth' | 'catalog' | 'cart' | 'order' | 'orders' | 'storage';

type ProxyRoute = {
  target: string;
  rewrite: (path: string) => string;
};

@Injectable()
export class GatewayProxyService {
  private readonly logger = new Logger(GatewayProxyService.name);
  private readonly proxies = new Map<ServiceKey, RequestHandler>();
  private readonly routes: Record<ServiceKey, ProxyRoute>;

  constructor(private readonly configService: ConfigService) {
    this.routes = {
      auth: {
        target:
          this.configService.get<string>('AUTH_SERVICE_URL') ??
          'http://auth-service:4001',
        rewrite: (path) => path.replace(/^\/api\/auth(?=\/|$)/, '/auth'),
      },
      catalog: {
        target:
          this.configService.get<string>('CATALOG_SERVICE_URL') ??
          'http://catalog-service:4003',
        rewrite: (path) => path.replace(/^\/api\/catalog(?=\/|$)/, '') || '/',
      },
      cart: {
        target:
          this.configService.get<string>('CART_SERVICE_URL') ??
          'http://cart-service:4002',
        rewrite: (path) => path.replace(/^\/api\/cart(?=\/|$)/, '') || '/',
      },
      order: {
        target:
          this.configService.get<string>('ORDER_SERVICE_URL') ??
          'http://order-service:4004',
        rewrite: (path) => path.replace(/^\/api\/order(?=\/|$)/, '') || '/',
      },
      orders: {
        target:
          this.configService.get<string>('ORDER_SERVICE_URL') ??
          'http://order-service:4004',
        rewrite: (path) => path.replace(/^\/api\/orders(?=\/|$)/, '/orders'),
      },
      storage: {
        target:
          this.configService.get<string>('STORAGE_SERVICE_URL') ??
          'http://storage-service:4005',
        rewrite: (path) => path.replace(/^\/api\/storage(?=\/|$)/, '') || '/',
      },
    };

    for (const service of Object.keys(this.routes) as ServiceKey[]) {
      this.proxies.set(service, this.createProxy(service));
    }
  }

  proxy(service: ServiceKey, request: Request, response: Response) {
    const proxy = this.proxies.get(service);

    if (!proxy) {
      throw new NotFoundException(`Unknown gateway route: ${service}`);
    }

    return proxy(request, response, (error?: unknown) => {
      if (error) {
        this.logger.error(`Proxy error for ${service}`, error as Error);
        throw new BadGatewayException(`Cannot reach ${service}`);
      }
    });
  }

  private createProxy(service: ServiceKey) {
    const route = this.routes[service];

    return createProxyMiddleware({
      target: route.target,
      changeOrigin: true,
      xfwd: true,
      pathRewrite: route.rewrite,
      onError: (error, request, response) => {
        this.logger.error(
          `Proxy ${service} failed for ${request.method} ${request.url}: ${error.message}`,
        );

        if ('headersSent' in response && !response.headersSent) {
          response.writeHead(502, { 'content-type': 'application/json' });
        }

        response.end(
          JSON.stringify({
            statusCode: 502,
            message: `Cannot reach ${service}`,
          }),
        );
      },
      onProxyReq: (proxyRequest, request) => {
        const userId = request.headers['x-user-id'];
        const userScope = request.headers['x-user-scope'];

        if (typeof userId === 'string') {
          proxyRequest.setHeader('x-user-id', userId);
        }

        if (typeof userScope === 'string') {
          proxyRequest.setHeader('x-user-scope', userScope);
        }
      },
    });
  }
}
