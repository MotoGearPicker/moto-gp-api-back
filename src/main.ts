import './common/sentry/instrument';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { config } from './config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { writeFileSync } from 'fs';

async function bootstrap() {
  const env = config();
  const corsUrls = env.CORS_URLS.split(',').map((u) => u.trim()).filter(Boolean);

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: env.APP_ENV === 'local' ? true : corsUrls,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Moto Gear Picker API')
    .setDescription('API para selección y gestión de equipamiento de moto')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  writeFileSync('./swagger-spec.json', JSON.stringify(document, null, 2));

  const port = env.PORT;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}/api`);
  console.log(`Swagger docs at    http://localhost:${port}/docs`);
}

bootstrap();
