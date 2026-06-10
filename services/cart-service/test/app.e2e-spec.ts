import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';

describe('CartService (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          // Разрешаем доступ только если есть тестовый заголовок
          if (req.headers['x-test-auth']) {
            req.user = { sub: 'test-user-123' };
            return true;
          }
          return false;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/cart (GET)', () => {
    it('rejects unauthorized requests (403/401)', async () => {
      const res = await request(app.getHttpServer()).get('/cart');
      // Поскольку мы захардкодили `return false` в гварде, Nest может вернуть 403 Forbidden.
      // В реальном JwtAuthGuard он бросает UnauthorizedException (401). 
      // Проверим, что статус не 200.
      expect([401, 403]).toContain(res.status);
    });

    it('returns empty cart for new user', async () => {
      // Сначала очистим корзину, чтобы тест был идемпотентным
      await request(app.getHttpServer()).delete('/cart').set('x-test-auth', 'true');

      const res = await request(app.getHttpServer())
        .get('/cart')
        .set('x-test-auth', 'true')
        .expect(200);

      expect(res.body).toHaveProperty('items');
      expect(res.body.items).toEqual([]);
    });
  });

  describe('/cart/items (POST, PATCH, DELETE)', () => {
    const testProductId = 9999; // Фейковый ID товара для теста

    beforeEach(async () => {
      // Очищаем корзину перед каждым тестом
      await request(app.getHttpServer()).delete('/cart').set('x-test-auth', 'true');
    });

    it('adds item to cart', async () => {
      const res = await request(app.getHttpServer())
        .post('/cart/items')
        .set('x-test-auth', 'true')
        .send({ productId: testProductId, quantity: 2 })
        .expect(201); // Обратите внимание: POST по умолчанию возвращает 201 Created

      expect(res.body.items).toBeDefined();
      const addedItem = res.body.items.find(i => i.productId === testProductId);
      expect(addedItem).toBeDefined();
      expect(addedItem.quantity).toBe(2);
    });

    it('updates item quantity', async () => {
      // Сначала добавим
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('x-test-auth', 'true')
        .send({ productId: testProductId, quantity: 1 });

      // Теперь обновим через PATCH (или PUT, если используется он. Посмотрим на контроллер)
      // Контроллер использует @Patch('cart/items/:productId')
      const res = await request(app.getHttpServer())
        .patch(`/cart/items/${testProductId}`)
        .set('x-test-auth', 'true')
        .send({ quantity: 5 })
        .expect(200);

      const updatedItem = res.body.items.find(i => i.productId === testProductId);
      expect(updatedItem).toBeDefined();
      expect(updatedItem.quantity).toBe(5);
    });

    it('removes item from cart', async () => {
      // Сначала добавим
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('x-test-auth', 'true')
        .send({ productId: testProductId, quantity: 1 });

      // Удаляем
      const res = await request(app.getHttpServer())
        .delete(`/cart/items/${testProductId}`)
        .set('x-test-auth', 'true')
        .expect(200);

      const deletedItem = res.body.items.find(i => i.productId === testProductId);
      expect(deletedItem).toBeUndefined();
    });
  });

  afterAll(async () => {
    // В конце убираем за собой
    await request(app.getHttpServer()).delete('/cart').set('x-test-auth', 'true');
    await app.close();
  });
});
