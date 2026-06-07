import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

// Запускает cart-service, настраивает CORS, cookie parser, Swagger и глобальную валидацию DTO.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const allowedOrigins = [
    process.env.CLIENT_URL ?? 'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
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
    .setTitle('MarketAI Cart API')
    .setDescription(
      [
        'Persistent shopping-state API for buyer accounts.',
        '',
        'This service stores the buyer cart, favorite products and compare list so they survive page reloads and device/browser restarts.',
        '',
        'Authentication:',
        '- Uses the same BUYER accessToken HttpOnly cookie issued by auth-service.',
        '- JWT sub is treated as Account.id.',
        '- Seller tokens are rejected because shopping state belongs to buyer sessions.',
        '',
        'Data model:',
        '- Cart stores productId and quantity.',
        '- Favorites store productId values.',
        '- Compare stores productId values and enforces a six-product limit.',
        '- Product titles, prices and media are resolved by the client/catalog using productId.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addServer('http://127.0.0.1:4002', 'Local development')
    .addServer('http://localhost:4002', 'Local development (localhost)')
    .addTag('Cart', 'Buyer cart item persistence')
    .addTag('Favorites', 'Buyer favorite product persistence')
    .addTag('Compare', 'Buyer product comparison persistence')
    .addTag('Health', 'Service health check')
    .addCookieAuth(
      'accessToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description:
          'Buyer JWT access token issued by auth-service and stored as an HttpOnly cookie',
      },
      'accessToken',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  groupCartSwaggerTags(swaggerDocument);

  SwaggerModule.setup('docs', app, swaggerDocument, {
    customSiteTitle: 'MarketAI Cart API',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });

  await app.listen(process.env.CART_SERVICE_PORT ?? 4002);
}

function groupCartSwaggerTags(document: OpenAPIObject) {
  const tagDescriptions = new Map(
    (document.tags ?? []).map((tag) => [tag.name, tag.description]),
  );

  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (!operation || typeof operation !== 'object' || !('tags' in operation)) {
        continue;
      }

      operation.tags = [getCartSwaggerTag(path)];
    }
  }

  document.tags = ['Cart', 'Favorites', 'Compare', 'Health'].map((name) => ({
    name,
    description: tagDescriptions.get(name),
  }));
}

function getCartSwaggerTag(path: string) {
  if (path.startsWith('/favorites')) {
    return 'Favorites';
  }

  if (path.startsWith('/compare')) {
    return 'Compare';
  }

  if (path.startsWith('/cart')) {
    return 'Cart';
  }

  return 'Health';
}

bootstrap();
