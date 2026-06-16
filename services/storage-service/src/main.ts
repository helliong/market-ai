import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.ADMIN_CLIENT_URL ?? 'http://127.0.0.1:5173',
      process.env.CLIENT_URL ?? 'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MarketAI Storage Service')
    .setDescription(
      [
        'File storage API for product media uploads.',
        '',
        'The service returns presigned S3-compatible upload URLs and public object URLs for the marketplace clients.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addServer('http://127.0.0.1:4005', 'Local development')
    .addServer('http://localhost:4005', 'Local development (localhost)')
    .addTag('Uploads', 'Presigned upload URLs and object deletion')
    .addTag('Health', 'Service health check')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  groupStorageSwaggerTags(swaggerDocument);

  SwaggerModule.setup('docs', app, swaggerDocument, {
    customSiteTitle: 'MarketAI Storage API',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });

  await app.listen(process.env.STORAGE_SERVICE_PORT ?? 4005);
}

function groupStorageSwaggerTags(document: OpenAPIObject) {
  const tagDescriptions = new Map(
    (document.tags ?? []).map((tag) => [tag.name, tag.description]),
  );

  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (!operation || typeof operation !== 'object' || !('tags' in operation)) {
        continue;
      }

      operation.tags = [path.startsWith('/uploads') ? 'Uploads' : 'Health'];
    }
  }

  document.tags = ['Uploads', 'Health'].map((name) => ({
    name,
    description: tagDescriptions.get(name),
  }));
}

bootstrap();
