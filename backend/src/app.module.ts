import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TrainersModule } from './modules/trainers/trainers.module';
import { RenewalsModule } from './modules/renewals/renewals.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BranchesModule } from './modules/branches/branches.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
      { name: 'auth', ttl: 60000, limit: 5 },
    ]),

    ScheduleModule.forRoot(),

    BullModule.forRoot({
      redis: process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        ...(process.env.REDIS_TLS === 'true' ? { tls: {} } : {}),
      },
    }),

    PrismaModule,
    AuthModule,
    MembersModule,
    AttendanceModule,
    PaymentsModule,
    TrainersModule,
    RenewalsModule,
    NotificationsModule,
    AnalyticsModule,
    BranchesModule,
    OrganizationsModule,
    DashboardModule,
    WhatsappModule,
    UploadsModule,
    HealthModule,
  ],
})
export class AppModule {}
