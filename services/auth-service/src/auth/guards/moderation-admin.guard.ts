import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ModerationAdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  // Проверяет x-admin-key для ручной модерации продавцов.
  canActivate(context: ExecutionContext) {
    const expectedKey = this.configService.get<string>('MODERATION_ADMIN_KEY');

    if (!expectedKey) {
      throw new ForbiddenException('Moderation admin key is not configured');
    }

    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-admin-key'];

    if (providedKey !== expectedKey) {
      throw new ForbiddenException('Invalid moderation admin key');
    }

    return true;
  }
}
