import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app-module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Preserve the exact payload required by payment-provider signature verification.
    rawBody: true,
  });
  const logger = new Logger('Bootstrap');

  app.enableShutdownHooks();

  // Secure CORS Configuration
  const corsOriginsEnv = process.env.CORS_ORIGINS;
  const corsOrigins = corsOriginsEnv ? corsOriginsEnv.split(',').map((origin) => origin.trim()) : '*';

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  });

  logger.log(`CORS Origins Configured: ${Array.isArray(corsOrigins) ? corsOrigins.join(', ') : 'ALL (*)'}`);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Cloud platforms inject PORT; binding to all interfaces is required in containers.
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 API running on http://0.0.0.0:${port}/api`);
}

bootstrap();
