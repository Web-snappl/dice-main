import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app-module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Enable raw body for Stripe webhook signature verification
    rawBody: true,
  });
  const logger = new Logger('Bootstrap');

  // Reverting to Standard CORS with Logging for Debugging
  // The manual middleware caused a crash. We will log all origins to stdout.
  app.enableCors({
    origin: (origin, callback) => {
      // Log the origin to Railway logs so we can see what's happening
      if (origin) {
        console.log(`[CORS] Incoming request from origin: ${origin}`);
      } else {
        console.log(`[CORS] Incoming request with NO ORIGIN`);
      }

      // TEMPORARY: Allow everything to modify if the crash persists
      // We will restrict this after confirming the app stays online
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Use Railway's PORT env var (they set it, we must listen on it)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 API running on http://0.0.0.0:${port}/api`);
}

bootstrap();

