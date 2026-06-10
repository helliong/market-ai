import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('ApiGateway (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    
    // Устанавливаем маленькие лимиты только для тестов, 
    // чтобы быстро проверить блокировку Rate Limiter
    process.env.RATE_LIMIT_PUBLIC_LIMIT = '2';
    process.env.RATE_LIMIT_PUBLIC_TTL_MS = '60000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('rejects protected routes without an access token', () => {
    return request(app.getHttpServer())
      .post('/api/orders')
      .expect(401)
      .expect(({ body }) => {
        expect(body.message).toBe('Missing access token');
      });
  });

  it('allows public routes without an access token', async () => {
    const res = await request(app.getHttpServer()).get('/api/catalog/products');
    
    // Gateway пропустил запрос через гварды (нет ошибки 401). 
    // Статус может быть 200 (если `catalog-service` работает локально) 
    // или 504 Gateway Timeout (если микросервисы сейчас выключены).
    expect(res.status).not.toBe(401);
  });

  it('enforces rate limiting', async () => {
    // 1-й запрос: Успех
    await request(app.getHttpServer()).get('/api/catalog/products');
    // 2-й запрос: Успех (достигнут лимит 2)
    await request(app.getHttpServer()).get('/api/catalog/products');

    // 3-й запрос: Блокировка!
    const blockedRes = await request(app.getHttpServer()).get('/api/catalog/products');
    expect(blockedRes.status).toBe(429);
  });

  afterEach(async () => {
    await app.close();
  });
});
