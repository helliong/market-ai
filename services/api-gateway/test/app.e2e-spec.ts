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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('rejects protected routes without an access token', () => {
    return request(app.getHttpServer())
      .get('/api/cart')
      .expect(401)
      .expect(({ body }) => {
        expect(body.message).toBe('Missing access token');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
