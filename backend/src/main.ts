import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Atrás do proxy do Render, req.ip precisa ser o IP do cliente (X-Forwarded-For), senão todos dividem o mesmo limite.
  app.set('trust proxy', 1);
  app.use(json({ limit: '10mb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
  const config = app.get(ConfigService);
  const allowedOrigins = config
    .get<string>('ALLOWED_ORIGINS', 'http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  app.enableCors({
    // Lista fixa + versões de teste do Cloudflare (https://<versao>-usinalink.tibiel2010.workers.dev).
    origin: (origin, callback) => {
      const ok = !origin || allowedOrigins.includes(origin) || /^https:\/\/(www\.)?usinalink\.com\.br$/.test(origin) || /^https:\/\/[a-z0-9-]+-usinalink\.tibiel2010\.workers\.dev$/.test(origin);
      callback(null, ok ? origin : false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`UsinaLink NestJS backend rodando em http://localhost:${port}`);
}

void bootstrap();
