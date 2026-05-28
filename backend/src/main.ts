import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './app.module';

async function seedDatabaseIfEmpty() {
  const prisma = new PrismaClient();
  try {
    const orgCount = await prisma.organization.count();
    if (orgCount > 0) {
      console.log('✅ Database already seeded, skipping...');
      return;
    }

    console.log('🌱 Seeding database...');

    const org = await prisma.organization.create({
      data: {
        name: '619 Fitness Studio',
        slug: 'demo-gym',
        phone: '9876543210',
        email: 'owner@619fitness.com',
        city: 'Mumbai',
        state: 'Maharashtra',
        subscriptionPlan: 'GROWTH',
        subscriptionExpiry: new Date(Date.now() + 365 * 86400000),
        isActive: true,
        whatsappEnabled: false,
        smsEnabled: false,
      },
    });

    const branch = await prisma.branch.create({
      data: {
        organizationId: org.id,
        name: '619 Fitness Studio - Main Branch',
        code: 'GYM-01',
        address: '123, Fitness Street, Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        phone: '9876543210',
        status: 'ACTIVE',
        openTime: '06:00',
        closeTime: '22:00',
        capacity: 200,
      },
    });

    const ownerPass = await bcrypt.hash('Gym@1234', 10);
    await prisma.user.create({
      data: {
        organizationId: org.id,
        branchId: branch.id,
        name: 'Abhishek Kumar',
        phone: '9876543210',
        email: 'owner@619fitness.com',
        passwordHash: ownerPass,
        role: 'OWNER',
        gender: 'MALE',
        isActive: true,
      },
    });

    const plansData = [
      { name: 'Monthly Basic', planType: 'MONTHLY', days: 30, price: 999 },
      { name: 'Monthly Premium', planType: 'MONTHLY', days: 30, price: 1499 },
      { name: 'Quarterly', planType: 'QUARTERLY', days: 90, price: 2499 },
      { name: '6 Months', planType: 'HALF_YEARLY', days: 180, price: 4499 },
      { name: 'Annual', planType: 'YEARLY', days: 365, price: 7999 },
    ];

    for (const p of plansData) {
      await prisma.membershipPlan.create({
        data: {
          organizationId: org.id,
          name: p.name,
          planType: p.planType,
          durationDays: p.days,
          price: p.price,
          isActive: true,
        },
      });
    }

    await prisma.organizationSettings.create({
      data: {
        organizationId: org.id,
        renewal7DayEnabled: true,
        renewal3DayEnabled: true,
        renewalDayEnabled: true,
        renewalPost3DayEnabled: true,
        renewalPost7DayEnabled: true,
        absentAlertDays: 5,
        gstEnabled: false,
      },
    });

    console.log('🎉 Database seeded successfully!');
    console.log('📱 Login: 9876543210 / Gym@1234');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('GymOS India API')
      .setDescription('Hindi-First WhatsApp-First Gym Operating System')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication')
      .addTag('members', 'Member Management')
      .addTag('attendance', 'Attendance System')
      .addTag('payments', 'Payment Management')
      .addTag('trainers', 'Trainer Management')
      .addTag('renewals', 'Renewal Automation')
      .addTag('notifications', 'Notification System')
      .addTag('analytics', 'Analytics & Reports')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🏋️ GymOS India Backend running on port ${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api/docs`);

  await seedDatabaseIfEmpty();
}

bootstrap();
