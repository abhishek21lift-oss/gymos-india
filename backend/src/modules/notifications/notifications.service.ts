import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
  ) {}

  async sendWelcome(member: any, plan: any) {
    const expiryStr = plan?.endDate
      ? new Date(plan.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'N/A';

    await this.whatsapp.sendWelcome(
      member.phone, member.name, member.memberId, plan?.plan?.name || 'Membership', expiryStr,
    );

    await this.logNotification(member.id, 'WELCOME', 'WHATSAPP', member.phone, 'Welcome message sent');
  }

  async sendAbsentAlert(member: any, absentDays: number) {
    try {
      await this.whatsapp.sendAbsentAlert(member.phone, member.name, absentDays);
      await this.logNotification(member.id, 'ATTENDANCE_ALERT', 'WHATSAPP', member.phone,
        `Absent for ${absentDays} days alert`);
    } catch (err) {
      this.logger.error(`Absent alert failed for ${member.phone}: ${err.message}`);
    }
  }

  async sendPaymentReceipt(member: any, payment: any, planName: string) {
    try {
      await this.whatsapp.sendPaymentReceipt(
        member.phone, member.name, payment.totalAmount, payment.receiptNumber, planName,
      );
      await this.logNotification(member.id, 'PAYMENT_DUE', 'WHATSAPP', member.phone,
        `Payment receipt: ${payment.receiptNumber}`);
    } catch (err) {
      this.logger.error(`Payment receipt failed: ${err.message}`);
    }
  }

  async sendBroadcast(branchId: string, message: string, filter?: { status?: string }) {
    const where: any = { branchId, isActive: true };
    if (filter?.status) where.status = filter.status;

    const members = await this.prisma.member.findMany({
      where,
      select: { id: true, name: true, phone: true },
    });

    this.logger.log(`Broadcasting to ${members.length} members`);

    const results = await this.whatsapp.sendBulkMessage(
      members.map(m => m.phone),
      message,
      800,
    );

    // Log all notifications
    await this.prisma.notification.createMany({
      data: members.map(m => ({
        memberId: m.id,
        type: 'PROMOTIONAL' as any,
        channel: 'WHATSAPP' as any,
        phone: m.phone,
        body: message,
        status: 'SENT' as any,
        sentAt: new Date(),
      })),
      skipDuplicates: true,
    });

    return {
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total: members.length,
    };
  }

  async getNotificationHistory(memberId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async logNotification(
    memberId: string,
    type: string,
    channel: string,
    phone: string,
    body: string,
    status: string = 'SENT',
  ) {
    return this.prisma.notification.create({
      data: {
        memberId,
        type: type as any,
        channel: channel as any,
        phone,
        body,
        status: status as any,
        sentAt: status === 'SENT' ? new Date() : undefined,
      },
    });
  }
}
