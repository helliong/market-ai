import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('CatalogService (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/products (GET)', () => {
    it('should return an array of products', async () => {
      const response = await request(app.getHttpServer()).get('/products');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Если в базе есть товары, можно проверить их структуру
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('sku');
      }
    });
  });

  describe('/products/:productId (GET)', () => {
    it('should return 400 or 404 for invalid product id', async () => {
      const response = await request(app.getHttpServer()).get('/products/999999');
      
      // Зависит от реализации, может быть 404 Not Found
      expect([400, 404]).toContain(response.status);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
