import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getClientUrl, loadRootEnv } from './env';

async function bootstrap() {
  // Сначала читаем корневой .env, чтобы YooKassa-ключи были доступны сервису заказов.
  loadRootEnv();

  const app = await NestFactory.create(AppModule);

  // Разрешаем клиентскому фронтенду отправлять checkout-запросы с cookies.
  app.enableCors({
    origin: [getClientUrl(), 'http://127.0.0.1:3000', 'http://localhost:3000'],
    credentials: true,
  });

  // По умолчанию order-service слушает порт 4004; на него же надо запускать ngrok.
  await app.listen(process.env.ORDER_SERVICE_PORT ?? 4004);
}
bootstrap();
