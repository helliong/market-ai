import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { getClientUrl, loadRootEnv } from './env';

async function bootstrap() {
  // Сначала читаем корневой .env, чтобы YooKassa-ключи были доступны сервису заказов.
  loadRootEnv();

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Разрешаем клиентскому фронтенду и админке отправлять checkout-запросы с cookies.
  app.enableCors({
    origin: [
      getClientUrl(), 
      'http://127.0.0.1:3000', 
      'http://localhost:3000',
      'http://127.0.0.1:3001', 
      'http://localhost:3001',
      'http://127.0.0.1:5173', 
      'http://localhost:5173'
    ],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MarketAI Order Service')
    .setDescription(
      [
        'Order, checkout and payment API.',
        '',
        'Buyer endpoints use the accessToken HttpOnly cookie. Seller endpoints use sellerAccessToken. YooKassa webhooks are public provider callbacks.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addServer('http://127.0.0.1:4004', 'Local development')
    .addServer('http://localhost:4004', 'Local development (localhost)')
    .addTag('Buyer orders', 'Checkout and buyer order management')
    .addTag('Seller orders', 'Seller order list and status management')
    .addTag('Payments', 'Payment provider callbacks and transitions')
    .addTag('Health', 'Service health check')
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
      'sellerAccessToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'sellerAccessToken',
        description: 'Seller JWT access token stored in an HttpOnly cookie',
      },
      'sellerAccessToken',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  groupOrderSwaggerTags(swaggerDocument);

  SwaggerModule.setup('docs', app, swaggerDocument, {
    customSiteTitle: 'MarketAI Order API',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });

  // По умолчанию order-service слушает порт 4004; на него же надо запускать ngrok.
  await app.listen(process.env.ORDER_SERVICE_PORT ?? 4004);
}

function groupOrderSwaggerTags(document: OpenAPIObject) {
  const tagDescriptions = new Map(
    (document.tags ?? []).map((tag) => [tag.name, tag.description]),
  );

  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (!operation || typeof operation !== 'object' || !('tags' in operation)) {
        continue;
      }

      operation.tags = [getOrderSwaggerTag(path)];
    }
  }

  document.tags = ['Buyer orders', 'Seller orders', 'Payments', 'Health'].map(
    (name) => ({
      name,
      description: tagDescriptions.get(name),
    }),
  );
}

function getOrderSwaggerTag(path: string) {
  if (path.startsWith('/seller/')) {
    return 'Seller orders';
  }

  if (path.startsWith('/payments/')) {
    return 'Payments';
  }

  if (path.startsWith('/orders')) {
    return 'Buyer orders';
  }

  return 'Health';
}

bootstrap();
