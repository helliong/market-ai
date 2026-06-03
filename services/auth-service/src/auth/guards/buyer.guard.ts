import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BuyerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  // Проверяет, что у текущего аккаунта есть buyer-профиль.
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const accountId = request.user?.sub;

    if (!accountId) {
      throw new UnauthorizedException('No account');
    }

    const user = await this.prisma.user.findUnique({
      where: { accountId },
    });

    if (!user) {
      throw new ForbiddenException('Buyer profile not found');
    }

    request.buyer = user;

    return true;
  }
}
