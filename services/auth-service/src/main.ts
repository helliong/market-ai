import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const requestLogger = new Logger('HTTP');

  app.use(cookieParser());
  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();

    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const origin = request.get('origin');
      const originSuffix = origin ? ` from ${origin}` : '';

      requestLogger.log(
        `${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms${originSuffix}`,
      );
    });

    next();
  });

  const allowedOrigins = [
    process.env.CLIENT_URL ?? 'http://localhost:3000',
    process.env.ADMIN_CLIENT_URL ?? 'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:5173',
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MarketAI Auth Service')
    .setDescription(
      [
        'Authentication API for buyer and seller profiles.',
        '',
        'Architecture:',
        '- Account stores shared email and email verification data.',
        '- AccountCredential stores scoped buyer/seller passwords, reset codes and refresh sessions.',
        '- User is the buyer profile.',
        '- UserSeller is the seller cabinet profile.',
        '',
        'One email belongs to one Account. Buyer and seller profiles can have separate passwords and sessions.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addServer('http://127.0.0.1:4001', 'Local development')
    .addServer('http://localhost:4001', 'Local development (localhost)')
    .addTag('Auth', 'Account, buyer profile and seller profile authorization')
    .addCookieAuth(
      'accessToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'Buyer JWT access token stored in an HttpOnly cookie',
      },
      'accessToken',
    )
    .addCookieAuth(
      'refreshToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'Buyer JWT refresh token stored in an HttpOnly cookie',
      },
      'refreshToken',
    )
    .addCookieAuth(
      'sellerAccessToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'sellerAccessToken',
        description: 'Seller JWT access token stored in an HttpOnly cookie',
      },
      'sellerAccessToken',
    )
    .addCookieAuth(
      'sellerRefreshToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'sellerRefreshToken',
        description: 'Seller JWT refresh token stored in an HttpOnly cookie',
      },
      'sellerRefreshToken',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument, {
    customSiteTitle: 'MarketAI Auth API',
    customCss: `
      :root {
        --marketai-primary: #6d4aff;
        --marketai-accent: #f59e0b;
        --marketai-ink: #111827;
      }

      .swagger-ui .topbar {
        background: linear-gradient(90deg, var(--marketai-ink), #2f255f);
        border-bottom: 4px solid var(--marketai-primary);
      }

      .swagger-ui .topbar-wrapper img {
        display: none;
      }

      .swagger-ui .topbar-wrapper::before {
        color: #fff;
        content: "MarketAI Auth API";
        font-size: 18px;
        font-weight: 800;
        letter-spacing: .02em;
      }

      .swagger-ui .info {
        margin: 36px 0 28px;
      }

      .swagger-ui .info .title {
        color: var(--marketai-ink);
        font-size: 36px;
        font-weight: 900;
      }

      .swagger-ui .info .title small {
        background: var(--marketai-primary);
      }

      .swagger-ui .scheme-container,
      .swagger-ui .opblock,
      .swagger-ui .model-box {
        border-radius: 8px;
        box-shadow: 0 10px 28px rgba(17, 24, 39, 0.08);
      }

      .swagger-ui .opblock.opblock-post {
        border-color: var(--marketai-primary);
        background: rgba(109, 74, 255, 0.04);
      }

      .swagger-ui .opblock.opblock-get {
        border-color: var(--marketai-accent);
        background: rgba(245, 158, 11, 0.05);
      }

      .swagger-ui .opblock .opblock-summary-method {
        border-radius: 6px;
      }

      .swagger-ui .btn.authorize,
      .swagger-ui .btn.execute {
        border-color: var(--marketai-primary);
        color: var(--marketai-primary);
      }
    `,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });

  await app.listen(process.env.PORT ?? 4001);
}

bootstrap();
