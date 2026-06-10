import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AppService } from './../src/app.service';

describe('StorageService (e2e)', () => {
  let app: INestApplication<App>;

  const mockAppService = {
    createPresignedUpload: jest.fn().mockResolvedValue({
      uploadUrl: 'http://fake-minio-url',
      publicUrl: 'http://fake-public-url',
      key: 'test-folder/fake-key.png',
    }),
    deleteObjects: jest.fn().mockImplementation((dto) => {
      return Promise.resolve({ deleted: dto.keys.length });
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AppService)
      .useValue(mockAppService)
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Включаем валидацию, как в main.ts
    const { ValidationPipe } = require('@nestjs/common');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    
    await app.init();
  });

  describe('/uploads/presigned-url (POST)', () => {
    it('returns a presigned upload URL and public URL', async () => {
      const response = await request(app.getHttpServer())
        .post('/uploads/presigned-url')
        .send({
          fileName: 'test-image.png',
          contentType: 'image/png',
          folder: 'test-folder'
        })
        .expect(201);

      expect(response.body).toHaveProperty('uploadUrl');
      expect(response.body).toHaveProperty('publicUrl');
      expect(response.body).toHaveProperty('key');
    });

    it('rejects invalid request body', async () => {
      await request(app.getHttpServer())
        .post('/uploads/presigned-url')
        .send({
          contentType: 'image/png'
        })
        .expect(400); // Bad Request (class-validator)
    });
  });

  describe('/uploads (DELETE)', () => {
    it('deletes objects and returns deleted count', async () => {
      const response = await request(app.getHttpServer())
        .delete('/uploads')
        .send({
          keys: ['test-folder/fake-image.png']
        })
        .expect(200);

      expect(response.body).toHaveProperty('deleted');
      expect(response.body.deleted).toBe(1);
    });
    
    it('returns 0 when keys array is empty', async () => {
      const response = await request(app.getHttpServer())
        .delete('/uploads')
        .send({
          keys: []
        })
        .expect(200);

      expect(response.body.deleted).toBe(0);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

