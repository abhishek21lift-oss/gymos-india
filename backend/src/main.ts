import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
    });

    app.setGlobalPrefix('api/v1');

    // Security headers
    app.use(helmet());

    // CORS
    const frontendUrl = process.env.FRONTEND_URL;
    app.enableCors({
      origin: frontendUrl ? [frontendUrl] : ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

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

    // Swagger only in development
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('GymOS India API')
        .setDescription(
          'Hindi-First WhatsApp-First Gym Operating System',
        )
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);

      SwaggerModule.setup('api/docs', app, document);
    }

    const port = Number(process.env.PORT) || 3001;

    await app.listen(port, '0.0.0.0');

    console.log(`Server running on port ${port}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Docs: http://localhost:${port}/api/docs`);
    }
  } catch (error) {
    console.error('Application failed to start:', error);
    process.exit(1);
  }
}

bootstrap();
