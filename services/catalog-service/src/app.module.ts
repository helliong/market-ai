import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SellerJwtStrategy } from './auth/seller-jwt.strategy';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { SellerProductsModule } from './seller-products/seller-products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['../../.env', '.env'],
      isGlobal: true,
    }),
    PassportModule,
    PrismaModule,
    ProductsModule,
    SellerProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SellerJwtStrategy],
})
export class AppModule {}
