import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AuthService (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/auth/me (GET)', () => {
    it('rejects missing access token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Unauthorized');
        });
    });
  });

  describe('/auth/seller/me (GET)', () => {
    it('rejects missing seller token', () => {
      return request(app.getHttpServer())
        .get('/auth/seller/me')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Unauthorized');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    it('returns 401 for invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'fake@example.com', password: 'wrongpassword' });
        
      expect(response.status).toBe(401);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
