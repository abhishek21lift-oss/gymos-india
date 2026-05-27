import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RenewalsService {
  private readonly logger = new Logger(RenewalsService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private notifications: NotificationsService,
  ) {}

  // ── CRON: Daily Renewal Reminders (runs at 10 AM) ─────────
  @Cron('0 10 * * *', { name: 'renewal_reminders' })
  async sendRenewalReminders() {
    this.logger.log('⏰ Running renewal reminder cron job...');

    const today = new Date();

    // 7 days before expiry
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    // 3 days before expiry
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    // 3 days after expiry
    const minus3Days = new Date(today);
    minus3Days.setDate(minus3Days.getDate() - 3);

    // 7 days after expiry
    const minus7Days = new Date(today);
    minus7Days.setDate(minus7Days.getDate() - 7);

    await Promise.all([
      this.processReminderGroup('7_DAYS', in7Days),
      this.processReminderGroup('3_DAYS', in3Days),
      this.processReminderGroup('TODAY', today),
      this.processReminderGroup('POST_3_DAYS', minus3Days),
      this.processReminderGroup('POST_7_DAYS', minus7Days),
    ]);

    this.logger.log('✅ Renewal reminders sent successfully');
  }

  private async processReminderGroup(type: string, targetDate: Date) {
    const dateStart = new Date(targetDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(targetDate);
    dateEnd.setHours(23, 59, 59, 999);

    const memberships = await this.prisma.membership.findMany({
      where: {
        endDate: { gte: dateStart, lte: dateEnd },
        status: type.startsWith('POST') ? 'EXPIRED' : 'ACTIVE',
      },
      include: {
        member: true,
        plan: true,
      },
    });

    this.logger.log(`📱 ${type}: Found ${memberships.length} members to notify`);

    for (const membership of memberships) {
      const { member, plan } = membership;
      if (!member.phone) continue;

      try {
        const expiryStr = membership.endDate.toLocaleDateString('en-IN', {
          day: '2-digit', month: 'long', year: 'numeric',
        });

        switch (type) {
          case '7_DAYS':
            await this.whatsapp.sendRenewalReminder7Days(member.phone, member.name, expiryStr, plan.name);
            break;
          case '3_DAYS':
            await this.whatsapp.sendRenewalReminder3Days(member.phone, member.name, expiryStr);
            break;
          case 'TODAY':
            await this.whatsapp.sendRenewalReminderToday(member.phone, member.name);
            break;
          case 'POST_3_DAYS':
            await this.whatsapp.sendPostExpiry3Days(member.phone, member.name);
            break;
          case 'POST_7_DAYS':
            await this.whatsapp.sendPostExpiry7Days(member.phone, member.name);
            break;
        }

        // Log notification
        await this.prisma.notification.create({
          data: {
            memberId: member.id,
            type: 'RENEWAL_REMINDER',
            channel: 'WHATSAPP',
            phone: member.phone,
            body: `Renewal reminder sent: ${type}`,
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        // Rate limiting
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        this.logger.error(`Failed to send reminder to ${member.phone}: ${err.message}`);
        await this.prisma.notification.create({
          data: {
            memberId: member.id,
            type: 'RENEWAL_REMINDER',
            channel: 'WHATSAPP',
            phone: member.phone,
            body: `Renewal reminder failed: ${type}`,
            status: 'FAILED',
            failReason: err.message,
            failedAt: new Date(),
          },
        });
      }
    }
  }

  // ── CRON: Auto-expire memberships (daily midnight) ────────
  @Cron('0 0 * * *', { name: 'auto_expire_memberships' })
  async autoExpireMemberships() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expired = await this.prisma.membership.updateMany({
      where: {
        endDate: { lt: today },
        status: 'ACTIVE',
      },
      data: { status: 'EXPIRED' },
    });

    // Update member status
    const expiredMemberships = await this.prisma.membership.findMany({
      where: { endDate: { lt: today }, status: 'EXPIRED' },
      select: { memberId: true },
    });

    if (expiredMemberships.length > 0) {
      await this.prisma.member.updateMany({
        where: {
          id: { in: expiredMemberships.map((m) => m.memberId) },
          memberships: { none: { status: 'ACTIVE' } },
        },
        data: { status: 'EXPIRED' },
      });
    }

    this.logger.log(`🔄 Auto-expired ${expired.count} memberships`);
  }

  // ── CRON: Birthday wishes (daily at 8 AM) ─────────────────
  @Cron('0 8 * * *', { name: 'birthday_wishes' })
  async sendBirthdayWishes() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const birthdayMembers = await this.prisma.member.findMany({
      where: {
        isActive: true,
        dateOfBirth: {
          not: null,
        },
      },
    });

    const todayBirthdays = birthdayMembers.filter((m) => {
      if (!m.dateOfBirth) return false;
      const dob = new Date(m.dateOfBirth);
      return dob.getMonth() + 1 === month && dob.getDate() === day;
    });

    for (const member of todayBirthdays) {
      try {
        await this.whatsapp.sendBirthdayWish(member.phone, member.name);
        this.logger.log(`🎂 Birthday wish sent to ${member.name}`);
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        this.logger.error(`Birthday wish failed: ${err.message}`);
      }
    }
  }

  // ── Get Expiring Members (for dashboard) ──────────────────
  async getExpiringMembers(branchId: string, days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.membership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: today, lte: futureDate },
        member: { branchId },
      },
      include: {
        member: { select: { id: true, name: true, phone: true, memberId: true } },
        plan: { select: { name: true } },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  // ── Get Expired Members ───────────────────────────────────
  async getExpiredMembers(branchId: string, daysAgo: number = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysAgo);

    return this.prisma.membership.findMany({
      where: {
        status: 'EXPIRED',
        endDate: { gte: cutoff },
        member: { branchId },
      },
      include: {
        member: { select: { id: true, name: true, phone: true, memberId: true } },
        plan: { select: { name: true } },
      },
      orderBy: { endDate: 'desc' },
    });
  }

  // ── Manual Send Reminder ──────────────────────────────────
  async sendManualReminder(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        memberships: {
          where: { status: { in: ['ACTIVE', 'EXPIRED'] } },
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!member) throw new Error('Member not found');

    const membership = member.memberships[0];
    const expiryStr = membership?.endDate?.toLocaleDateString('en-IN') || 'N/A';

    await this.whatsapp.sendRenewalReminder3Days(member.phone, member.name, expiryStr);

    return { message: `Reminder sent to ${member.name} (${member.phone})` };
  }
}
