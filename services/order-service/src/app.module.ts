import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { SellerJwtStrategy } from './auth/seller-jwt.strategy';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['../../.env', '.env'],
      isGlobal: true,
    }),
    PassportModule,
    PrismaModule,
  ],
  controllers: [AppController, OrdersController],
  providers: [AppService, OrdersService, JwtStrategy, SellerJwtStrategy],
})
export class AppModule {}
