import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';
import { env } from '@nestjs-monorepo-template/common';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ZodValidationPipe());
  app.enableCors({
    origin: [
      env.WEB_URL,
      env.ADMIN_URL,
      'http://localhost:3002'
    ],
    credentials: true,
    exposedHeaders: ['x-total-count']
  });
  app.use(helmet());

  // Serve uploaded files statically for local development
  app.use('/uploads', express.static(join(process.cwd(), 'public', 'uploads')));

  const config = new DocumentBuilder()
    .setTitle('nestjs-monorepo-template API')
    .setDescription('The nestjs-monorepo-template API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const cleanedDocument = cleanupOpenApiDoc(document);
  SwaggerModule.setup('api', app, cleanedDocument);

  const host = `http://localhost:${env.PORT}`;
  console.log('\n\x1b[1m\x1b[32m🚀 Bootstrapping NestJS Monorepo Services...\x1b[0m\x1b[0m');
  console.log(`\x1b[34m➜\x1b[0m  \x1b[1mAPI Server:\x1b[0m      \x1b[36m${host}\x1b[0m`);
  console.log(`\x1b[34m➜\x1b[0m  \x1b[1mSwagger Docs:\x1b[0m    \x1b[36m${host}/api\x1b[0m`);
  console.log(`\x1b[34m➜\x1b[0m  \x1b[1mStorage Local:\x1b[0m   \x1b[36m${host}/uploads\x1b[0m`);
  console.log(`\x1b[34m➜\x1b[0m  \x1b[1mRedis Cache:\x1b[0m     \x1b[36mredis://${env.REDIS_HOST}:${env.REDIS_PORT}\x1b[0m\n`);

  await app.listen(env.PORT);
}

bootstrap();
