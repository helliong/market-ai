import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerStorageService } from '@nestjs/throttler';
import { GatewayAuthGuard } from './auth/gateway-auth.guard';
import { GatewayProxyController } from './proxy/gateway-proxy.controller';
import { GatewayProxyService } from './proxy/gateway-proxy.service';
import { GatewayThrottlerGuard } from './rate-limit/gateway-throttler.guard';
import { RedisThrottlerStorage } from './rate-limit/redis-throttler.storage';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    JwtModule.register({}),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage:
          config.get<string>('NODE_ENV') === 'test'
            ? new ThrottlerStorageService()
            : new RedisThrottlerStorage(
                config.get<string>('REDIS_URL') ?? 'redis://redis:6379',
              ),
        throttlers: [
          {
            name: 'public',
            ttl: Number(config.get('RATE_LIMIT_PUBLIC_TTL_MS') ?? 60000),
            limit: Number(config.get('RATE_LIMIT_PUBLIC_LIMIT') ?? 120),
          },
          {
            name: 'auth',
            ttl: Number(config.get('RATE_LIMIT_AUTH_TTL_MS') ?? 60000),
            limit: Number(config.get('RATE_LIMIT_AUTH_LIMIT') ?? 10),
            blockDuration: Number(
              config.get('RATE_LIMIT_AUTH_BLOCK_MS') ?? 300000,
            ),
          },
          {
            name: 'aiPublic',
            ttl: Number(config.get('RATE_LIMIT_AI_TTL_MS') ?? 60000),
            limit: Number(config.get('RATE_LIMIT_AI_LIMIT') ?? 20),
            skipIf: (context) =>
              Boolean(
                context.switchToHttp().getRequest<{ user?: unknown }>().user,
              ),
          },
          {
            name: 'default',
            ttl: Number(config.get('RATE_LIMIT_DEFAULT_TTL_MS') ?? 60000),
            limit: Number(config.get('RATE_LIMIT_DEFAULT_LIMIT') ?? 300),
          },
        ],
      }),
    }),
  ],
  controllers: [GatewayProxyController],
  providers: [
    GatewayProxyService,
    {
      provide: APP_GUARD,
      useClass: GatewayAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: GatewayThrottlerGuard,
    },
  ],
})
export class AppModule {}
