import 'dotenv/config';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { AppConfigService } from './config/app-config.service.js';
import { parseEnv } from './config/env.schema.js';
import { setupOpenApi } from './openapi.js';
import { mountAdminSpa } from './admin-spa.js';

parseEnv(process.env);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);
  if (config.env.NODE_ENV !== 'production') {
    setupOpenApi(app);
  }
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.enableCors({
    origin: config.corsOriginList(),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });
  app.useGlobalFilters(app.get(ApiExceptionFilter));
  mountAdminSpa(app);
  const port = config.env.PORT;
  await app.listen(port);
  Logger.log(`PartOn API listening on :${port}`, 'Bootstrap');
}
await bootstrap();
