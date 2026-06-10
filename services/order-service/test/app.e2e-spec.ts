import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { SellerJwtAuthGuard } from '../src/auth/seller-jwt-auth.guard';

describe('OrderService (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          if (req.headers['x-buyer-id']) {
            req.user = { sub: req.headers['x-buyer-id'] };
            return true;
          }
          return false;
        },
      })
      .overrideGuard(SellerJwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          if (req.headers['x-seller-id']) {
            req.user = { sub: req.headers['x-seller-id'] };
            return true;
          }
          return false;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/orders (GET) - Buyer', () => {
    it('rejects unauthorized requests', async () => {
      const res = await request(app.getHttpServer()).get('/orders');
      expect([401, 403]).toContain(res.status);
    });

    it('returns orders for authenticated buyer', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders')
        .set('x-buyer-id', 'buyer-123')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('/seller/orders (GET) - Seller', () => {
    it('rejects unauthorized requests', async () => {
      const res = await request(app.getHttpServer()).get('/seller/orders');
      expect([401, 403]).toContain(res.status);
    });

    it('returns orders for authenticated seller', async () => {
      const res = await request(app.getHttpServer())
        .get('/seller/orders')
        .set('x-seller-id', 'seller-456')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
