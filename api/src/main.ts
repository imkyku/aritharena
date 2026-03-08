import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from './common/logger/app-logger.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const frontendUrl = configService.getOrThrow<string>('FRONTEND_URL');
  const port = configService.getOrThrow<number>('PORT');

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: [frontendUrl, 'https://web.telegram.org'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  logger.log(`API listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
