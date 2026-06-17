import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { GatewayRequest } from '../auth/gateway-auth.guard';

@Injectable()
export class GatewayThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(request: GatewayRequest) {
    const forwardedFor = request.headers['x-forwarded-for']
      ?.toString()
      .split(',')[0]
      ?.trim();

    return (
      request.user?.userId ??
      forwardedFor ??
      request.ip ??
      'anonymous'
    );
  }
}
