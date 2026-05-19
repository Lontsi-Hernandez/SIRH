import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ── Sécurité ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());

  // ── CORS (Dynamic resolver supporting dev and production Vercel) ──────────
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3001',
  ];
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  if (frontendUrl) {
    allowedOrigins.push(frontendUrl);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origine (comme les apps mobiles ou postman/curl)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app') || 
        origin.startsWith('http://localhost:');
        
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    credentials: true,
  });

  // ── Préfixe global API ────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Validation globale ────────────────────────────────────────────────────
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

  // ── Swagger (documentation API) ───────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HRMS API')
      .setDescription('Human Resource Management System — API REST Documentation')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addApiKey({ type: 'apiKey', name: 'X-Tenant-ID', in: 'header' }, 'TenantID')
      .addTag('Auth', 'Authentification et gestion des tokens')
      .addTag('Employees', 'Gestion des employés')
      .addTag('Departments', 'Gestion des départements')
      .addTag('Shifts', 'Gestion des horaires et quarts de travail')
      .addTag('Leaves', 'Gestion des congés et absences')
      .addTag('Payroll', 'Gestion de la paie')
      .addTag('Recruitment', 'Module de recrutement ATS')
      .addTag('Performance', 'Évaluations et objectifs')
      .addTag('Training', 'Formation et certifications')
      .addTag('Notifications', 'Notifications et messagerie')
      .addTag('Analytics', 'Rapports et analytiques')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log(`📚 Swagger disponible sur: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`🚀 HRMS Backend démarré sur: http://localhost:${port}/api/v1`);
  logger.log(`🌍 Environnement: ${nodeEnv}`);
}

bootstrap();
