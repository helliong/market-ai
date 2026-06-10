import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthProfileService } from './auth-profile.service';
import { InternalController } from './internal.controller';
import { SellerProductsController } from './seller-products.controller';
import { SellerProductsService } from './seller-products.service';

@Module({
  imports: [PrismaModule],
  controllers: [SellerProductsController, InternalController],
  providers: [AuthProfileService, SellerProductsService],
})
export class SellerProductsModule {}
