import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getClientUrl, loadRootEnv } from './env';

async function bootstrap() {
  loadRootEnv();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [getClientUrl(), 'http://127.0.0.1:3000', 'http://localhost:3000'],
    credentials: true,
  });

  await app.listen(process.env.ORDER_SERVICE_PORT ?? 4004);
}
bootstrap();
