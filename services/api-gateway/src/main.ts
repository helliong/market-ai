import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const logger = new Logger('API Gateway');

  app.use(cookieParser());
  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();

    response.on('finish', () => {
      logger.log(
        `${request.method} ${request.originalUrl} ${response.statusCode} ${Date.now() - startedAt}ms`,
      );
    });

    next();
  });

  app.enableCors({
    origin: [
      process.env.CLIENT_URL ?? 'http://127.0.0.1:3000',
      process.env.ADMIN_CLIENT_URL ?? 'http://127.0.0.1:5173',
      process.env.MODERATION_CLIENT_URL ?? 'http://127.0.0.1:5174',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
    ],
    credentials: true,
  });

  await app.listen(process.env.API_GATEWAY_PORT ?? process.env.PORT ?? 4000);
}
bootstrap();
