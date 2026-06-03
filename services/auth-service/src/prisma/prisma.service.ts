import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ adapter });
  }

  // Открывает подключение Prisma к базе при старте Nest-модуля.
  async onModuleInit() {
    await this.$connect();
  }

  // Закрывает подключение Prisma при остановке Nest-модуля.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
