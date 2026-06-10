import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { GatewayRequest } from '../auth/gateway-auth.guard';

@Injectable()
export class GatewayThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(request: GatewayRequest) {
    return (
      request.user?.userId ??
      request.ip ??
      request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ??
      'anonymous'
    );
  }
}
