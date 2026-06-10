import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { isPublicGatewayRoute } from './public-gateway-routes';

export type GatewayUser = {
  userId: string;
  scope?: string;
};

type JwtPayload = {
  sub?: string;
  scope?: string;
};

export type GatewayRequest = Request & {
  user?: GatewayUser;
  cookies?: Record<string, string | undefined>;
};

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<GatewayRequest>();

    if (isPublicGatewayRoute(request.method, request.path)) {
      return true;
    }

    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw new UnauthorizedException('JWT access secret is not configured');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid access token payload');
      }

      request.user = {
        userId: payload.sub,
        scope: payload.scope,
      };
      request.headers['x-user-id'] = payload.sub;

      if (payload.scope) {
        request.headers['x-user-scope'] = payload.scope;
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractToken(request: GatewayRequest) {
    const authHeader = request.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length).trim();
    }

    return request.cookies?.accessToken ?? request.cookies?.sellerAccessToken;
  }
}
