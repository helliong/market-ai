import { Controller, Post, Param, Body, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('internal/sellers')
export class InternalSellersController {
  constructor(private readonly prisma: PrismaService) {}

  @Post(':sellerId/pause')
  async setPauseState(
    @Param('sellerId') sellerId: string,
    @Body('isPaused') isPaused: boolean,
  ) {
    // Basic protection (ideally should use a shared secret in microservices)
    if (typeof isPaused !== 'boolean') {
      throw new UnauthorizedException('Invalid payload');
    }

    await this.prisma.product.updateMany({
      where: { sellerId },
      data: { isSellerPaused: isPaused },
    });

    return { success: true };
  }
}
