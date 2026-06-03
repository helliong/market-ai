import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SellerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  // Проверяет, что у текущего аккаунта есть seller-профиль.
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const accountId = request.user?.sub;

    if (!accountId) {
      throw new UnauthorizedException('No account');
    }

    const seller = await this.prisma.userSeller.findUnique({
      where: { accountId },
    });

    if (!seller) {
      throw new ForbiddenException('Seller profile not found');
    }

    if (seller.status === 'SUSPENDED') {
      throw new ForbiddenException('Seller profile is suspended');
    }

    request.seller = seller;

    return true;
  }
}
