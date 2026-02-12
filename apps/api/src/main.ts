import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app-module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Enable raw body for Stripe webhook signature verification
    rawBody: true,
  });
  const logger = new Logger('Bootstrap');

  // Enhanced CORS configuration
  // Enhanced CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:8080',
      ];
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        /\.netlify\.app$/.test(origin) || // Allow all netlify subdomains
        /\.railway\.app$/.test(origin)    // Allow all railway subdomains
      ) {
        callback(null, true);
      } else {
        console.warn(`Blocked CORS request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Use Railway's PORT env var (they set it, we must listen on it)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 API running on http://0.0.0.0:${port}/api`);
}

bootstrap();

