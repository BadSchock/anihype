import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AppLogger } from './common/logger';

async function bootstrap() {
  const logger = new AppLogger();
  logger.setContext('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(logger);

  const port = process.env['PORT'] ?? '3001';
  const corsOrigin = process.env['CORS_ORIGIN'] ?? 'http://localhost:3002';
  const nodeEnv = process.env['NODE_ENV'] ?? 'development';

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger only in non-production
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AniHype API')
      .setDescription('AniHype V1 REST API — Documentação interna')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);

  logger.log(`🚀 AniHype API running on: http://localhost:${port}/api/v1`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔗 CORS origin: ${corsOrigin}`);
}

void bootstrap();
