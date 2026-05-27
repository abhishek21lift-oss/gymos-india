import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ── QR Check-In ───────────────────────────────────────────
  async checkInByQr(qrCode: string, branchId: string, markedBy?: string) {
    const member = await this.prisma.member.findFirst({
      where: { qrCode, branchId, isActive: true },
      include: {
        memberships: { where: { status: 'ACTIVE' }, take: 1 },
      },
    });

    if (!member) throw new NotFoundException('Member not found or QR invalid');

    // Check membership validity
    const activeMembership = member.memberships[0];
    if (!activeMembership) {
      throw new BadRequestException('No active membership. Please renew first.');
    }

    // Prevent duplicate check-in same day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await this.prisma.attendance.findFirst({
      where: {
        memberId: member.id,
        checkInTime: { gte: today },
      },
    });

    if (existing) {
      return { message: 'Already checked in today', attendance: existing, member };
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        memberId: member.id,
        branchId,
        checkInMethod: 'QR_SCAN',
        markedBy,
        status: 'PRESENT',
      },
    });

    // Update member stats
    await this.prisma.member.update({
      where: { id: member.id },
      data: {
        totalVisits: { increment: 1 },
        streakDays: { increment: 1 },
      },
    });

    return { message: `Welcome ${member.name}! 💪`, attendance, member };
  }

  // ── Manual Check-In ───────────────────────────────────────
  async checkInManual(memberId: string, branchId: string, markedBy: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, branchId, isActive: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await this.prisma.attendance.findFirst({
      where: { memberId, checkInTime: { gte: today } },
    });

    if (existing) return { message: 'Already checked in', attendance: existing };

    const attendance = await this.prisma.attendance.create({
      data: { memberId, branchId, checkInMethod: 'MANUAL', markedBy, status: 'PRESENT' },
    });

    await this.prisma.member.update({
      where: { id: memberId },
      data: { totalVisits: { increment: 1 } },
    });

    return { attendance };
  }

  // ── Check-Out ─────────────────────────────────────────────
  async checkOut(attendanceId: string) {
    const att = await this.prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!att) throw new NotFoundException('Attendance record not found');

    return this.prisma.attendance.update({
      where: { id: attendanceId },
      data: { checkOutTime: new Date() },
    });
  }

  // ── Today's Attendance ────────────────────────────────────
  async getTodayAttendance(branchId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [attendance, totalMembers] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { branchId, checkInTime: { gte: today } },
        include: {
          member: { select: { id: true, name: true, phone: true, profilePhotoUrl: true, memberId: true } },
        },
        orderBy: { checkInTime: 'desc' },
      }),
      this.prisma.member.count({ where: { branchId, isActive: true, status: 'ACTIVE' } }),
    ]);

    return {
      present: attendance.length,
      total: totalMembers,
      attendance,
    };
  }

  // ── Member Attendance History ─────────────────────────────
  async getMemberHistory(memberId: string, days: number = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    return this.prisma.attendance.findMany({
      where: { memberId, checkInTime: { gte: from } },
      orderBy: { checkInTime: 'desc' },
    });
  }

  // ── Trainer Check-In ──────────────────────────────────────
  async trainerCheckIn(trainerId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.trainerAttendance.findFirst({
      where: { trainerId, checkInTime: { gte: today } },
    });

    if (existing) return { message: 'Already checked in', attendance: existing };

    return this.prisma.trainerAttendance.create({
      data: { trainerId, status: 'PRESENT' },
    });
  }

  async trainerCheckOut(trainerId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const att = await this.prisma.trainerAttendance.findFirst({
      where: { trainerId, checkInTime: { gte: today }, checkOutTime: null },
    });

    if (!att) throw new NotFoundException('No active check-in found');

    return this.prisma.trainerAttendance.update({
      where: { id: att.id },
      data: { checkOutTime: new Date() },
    });
  }

  // ── CRON: Detect Absent Members (runs daily at 9 PM) ─────
  @Cron('0 21 * * *')
  async detectAbsentMembers() {
    console.log('🔍 Running absent member detection...');

    const settings = await this.prisma.organizationSettings.findMany();

    for (const setting of settings) {
      const absentDays = setting.absentAlertDays || 5;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - absentDays);

      // Find active members who haven't checked in
      const absentMembers = await this.prisma.member.findMany({
        where: {
          isActive: true,
          status: 'ACTIVE',
          branch: { organizationId: setting.organizationId },
          OR: [
            { attendance: { none: { checkInTime: { gte: cutoff } } } },
          ],
        },
        include: { branch: true },
        take: 100,
      });

      for (const member of absentMembers) {
        // Send WhatsApp nudge
        await this.notifications.sendAbsentAlert(member, absentDays);
      }
    }
  }

  // ── Attendance Stats ──────────────────────────────────────
  async getAttendanceStats(branchId: string, days: number = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const daily = await this.prisma.$queryRaw`
      SELECT 
        DATE(check_in_time) as date,
        COUNT(*) as count
      FROM "Attendance"
      WHERE branch_id = ${branchId}
        AND check_in_time >= ${from}
      GROUP BY DATE(check_in_time)
      ORDER BY date ASC
    `;

    const totalVisits = await this.prisma.attendance.count({
      where: { branchId, checkInTime: { gte: from } },
    });

    const uniqueMembers = await this.prisma.attendance.groupBy({
      by: ['memberId'],
      where: { branchId, checkInTime: { gte: from } },
    });

    return {
      dailyData: daily,
      totalVisits,
      uniqueMembers: uniqueMembers.length,
      avgDailyVisits: Math.round(totalVisits / days),
    };
  }
}
