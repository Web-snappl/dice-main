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
  // Manual CORS Middleware ("Nuclear Option")
  // We bypass NestJS's cors wrapper to ensure headers are ALWAYS sent for allowed origins
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8080',
    ];

    let isAllowed = false;
    if (!origin) {
      isAllowed = true; // Allow non-browser requests
    } else if (allowedOrigins.includes(origin)) {
      isAllowed = true;
    } else if (/\.netlify\.app$/.test(origin)) {
      isAllowed = true; // Allow all Netlify subdomains
    } else if (/\.railway\.app$/.test(origin)) {
      isAllowed = true; // Allow all Railway subdomains
    }

    if (isAllowed && origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Accept, X-Requested-With, Origin',
      );
    }

    // Intercept OPTIONS method
    if (req.method === 'OPTIONS') {
      if (isAllowed) {
        res.sendStatus(200);
      } else {
        // Optionally block unknown origins on preflight, or just let them fail
        // returning 200 without headers usually fails the browser check anyway
        res.sendStatus(204);
      }
      return;
    }

    next();
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Use Railway's PORT env var (they set it, we must listen on it)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 API running on http://0.0.0.0:${port}/api`);
}

bootstrap();

