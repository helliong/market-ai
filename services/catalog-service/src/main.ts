import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: [
      process.env.ADMIN_CLIENT_URL ?? 'http://127.0.0.1:5173',
      process.env.CLIENT_URL ?? 'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MarketAI Catalog Service')
    .setDescription(
      [
        'Catalog API for public products and seller product management.',
        '',
        'Seller endpoints use the sellerAccessToken HttpOnly cookie issued by auth-service.',
        'Use /auth/seller/login in auth-service first, then send requests with credentials enabled.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addServer('http://127.0.0.1:4003', 'Local development')
    .addServer('http://localhost:4003', 'Local development (localhost)')
    .addTag('Products', 'Public product catalog')
    .addTag('Seller products', 'Seller product management')
    .addCookieAuth(
      'sellerAccessToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'sellerAccessToken',
        description:
          'Seller JWT access token stored in an HttpOnly cookie by auth-service.',
      },
      'sellerAccessToken',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    customSiteTitle: 'MarketAI Catalog API',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });

  await app.listen(process.env.CATALOG_SERVICE_PORT ?? 4003);
}
bootstrap();
