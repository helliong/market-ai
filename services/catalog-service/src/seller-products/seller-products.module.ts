import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthProfileService } from './auth-profile.service';
import { SellerProductsController } from './seller-products.controller';
import { SellerProductsService } from './seller-products.service';
import { InternalSellersController } from './internal.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SellerProductsController, InternalSellersController],
  providers: [AuthProfileService, SellerProductsService],
})
export class SellerProductsModule {}
