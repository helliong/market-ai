import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
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
    .addTag('Public products', 'Public product catalog')
    .addTag('Seller products', 'Seller product management')
    .addTag('Internal', 'Internal service-to-service catalog operations')
    .addTag('Health', 'Service health check')
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
  groupCatalogSwaggerTags(swaggerDocument);

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

function groupCatalogSwaggerTags(document: OpenAPIObject) {
  const tagDescriptions = new Map(
    (document.tags ?? []).map((tag) => [tag.name, tag.description]),
  );

  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (!operation || typeof operation !== 'object' || !('tags' in operation)) {
        continue;
      }

      operation.tags = [getCatalogSwaggerTag(path)];
    }
  }

  document.tags = [
    'Public products',
    'Seller products',
    'Internal',
    'Health',
  ].map((name) => ({
    name,
    description: tagDescriptions.get(name),
  }));
}

function getCatalogSwaggerTag(path: string) {
  if (path.startsWith('/seller/products')) {
    return 'Seller products';
  }

  if (path.startsWith('/internal/')) {
    return 'Internal';
  }

  if (path.startsWith('/products')) {
    return 'Public products';
  }

  return 'Health';
}

bootstrap();
