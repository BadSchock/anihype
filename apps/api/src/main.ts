import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AppLogger } from './common/logger';
import { buildCorsOptions, parseCorsOrigins } from './config/cors.util';
import { resolveAvatarUploadRoot } from './modules/users/avatar-storage.service';

async function bootstrap() {
  const logger = new AppLogger();
  logger.setContext('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(logger);

  const port = process.env['PORT'] ?? '3001';
  const corsOrigins = parseCorsOrigins(process.env['CORS_ORIGIN']);
  const nodeEnv = process.env['NODE_ENV'] ?? 'development';

  app.enableCors(buildCorsOptions(corsOrigins));

  // Fora do prefixo /api/v1. O Nginx da API já encaminha o host inteiro.
  app.useStaticAssets(resolveAvatarUploadRoot(process.env['AVATAR_UPLOAD_DIR']), {
    prefix: '/uploads/',
    index: false,
    dotfiles: 'deny',
    fallthrough: true,
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
  logger.log(`🔗 CORS origins: ${corsOrigins.join(', ')}`);
}

void bootstrap();
