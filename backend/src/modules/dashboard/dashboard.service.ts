import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // ── Main Owner Dashboard ──────────────────────────────────
  async getOwnerDashboard(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    const absent5Days = new Date(today);
    absent5Days.setDate(absent5Days.getDate() - 5);

    const [
      todayRevenue,
      todayAttendance,
      expiringThisWeek,
      expiredMembers,
      pendingPayments,
      totalActiveMembers,
      totalMonthRevenue,
      recentPayments,
    ] = await Promise.all([
      // Today's revenue
      this.prisma.payment.aggregate({
        where: {
          branch: { organizationId },
          status: 'PAID',
          paidAt: { gte: today, lt: tomorrow },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Today's attendance
      this.prisma.attendance.count({
        where: {
          branch: { organizationId },
          checkInTime: { gte: today },
        },
      }),

      // Memberships expiring in 7 days
      this.prisma.membership.count({
        where: {
          status: 'ACTIVE',
          endDate: { gte: today, lte: in7Days },
          member: { branch: { organizationId } },
        },
      }),

      // Recently expired (last 15 days)
      this.prisma.membership.count({
        where: {
          status: 'EXPIRED',
          endDate: { gte: new Date(today.getTime() - 15 * 86400000) },
          member: { branch: { organizationId } },
        },
      }),

      // Pending payments
      this.prisma.payment.aggregate({
        where: {
          branch: { organizationId },
          status: 'PENDING',
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Total active members
      this.prisma.member.count({
        where: {
          branch: { organizationId },
          status: 'ACTIVE',
          isActive: true,
        },
      }),

      // This month's revenue
      this.prisma.payment.aggregate({
        where: {
          branch: { organizationId },
          status: 'PAID',
          paidAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
            lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
          },
        },
        _sum: { totalAmount: true },
      }),

      // Recent 5 payments
      this.prisma.payment.findMany({
        where: { branch: { organizationId }, status: 'PAID' },
        orderBy: { paidAt: 'desc' },
        take: 5,
        include: {
          member: { select: { name: true, memberId: true } },
        },
      }),
    ]);

    // Members absent 5+ days
    const absentMembers = await this.prisma.member.findMany({
      where: {
        branch: { organizationId },
        status: 'ACTIVE',
        isActive: true,
        attendance: { none: { checkInTime: { gte: absent5Days } } },
      },
      select: { id: true, name: true, phone: true, memberId: true },
      take: 10,
    });

    // Top performing trainers this month
    const trainerStats = await this.prisma.$queryRaw`
      SELECT 
        u.id, u.name,
        COUNT(DISTINCT m.id) as member_count,
        COUNT(DISTINCT a.id) as attendance_count,
        AVG(ps.member_rating) as avg_rating
      FROM "User" u
      LEFT JOIN "Member" m ON m.trainer_id = u.id AND m.status = 'ACTIVE'
      LEFT JOIN "Attendance" a ON a.member_id = m.id 
        AND a.check_in_time >= ${new Date(today.getFullYear(), today.getMonth(), 1)}
      LEFT JOIN "PTSession" ps ON ps.trainer_id = u.id
      WHERE u.organization_id = ${organizationId}
        AND u.role = 'TRAINER'
        AND u.is_active = true
      GROUP BY u.id, u.name
      ORDER BY member_count DESC
      LIMIT 5
    `;

    return {
      // 💰 Money
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      todayTransactions: todayRevenue._count,
      monthRevenue: totalMonthRevenue._sum.totalAmount || 0,
      pendingAmount: pendingPayments._sum.totalAmount || 0,
      pendingCount: pendingPayments._count,

      // 👥 Members
      totalActiveMembers,
      todayAttendance,
      expiringThisWeek,
      expiredRecently: expiredMembers,

      // ⚠️ Alerts
      absentMembers,
      absentCount: absentMembers.length,

      // 📊 Recent Activity
      recentPayments,
      trainerStats,
    };
  }

  // ── Branch-specific Dashboard ─────────────────────────────
  async getBranchDashboard(branchId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    const [todayRevenue, todayAttendance, expiringWeek, activeMembers, pendingPayments] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: { branchId, status: 'PAID', paidAt: { gte: today, lt: tomorrow } },
          _sum: { totalAmount: true },
        }),
        this.prisma.attendance.count({
          where: { branchId, checkInTime: { gte: today } },
        }),
        this.prisma.membership.count({
          where: {
            status: 'ACTIVE',
            endDate: { gte: today, lte: in7Days },
            member: { branchId },
          },
        }),
        this.prisma.member.count({
          where: { branchId, status: 'ACTIVE', isActive: true },
        }),
        this.prisma.payment.aggregate({
          where: { branchId, status: 'PENDING' },
          _sum: { totalAmount: true },
          _count: true,
        }),
      ]);

    return {
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      todayAttendance,
      expiringThisWeek: expiringWeek,
      activeMembers,
      pendingAmount: pendingPayments._sum.totalAmount || 0,
      pendingCount: pendingPayments._count,
    };
  }

  // ── Revenue Chart Data (last 30 days) ─────────────────────
  async getRevenueChart(organizationId: string, days: number = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const data = await this.prisma.$queryRaw`
      SELECT 
        DATE(p.paid_at) as date,
        SUM(p.total_amount) as revenue,
        COUNT(*) as transactions
      FROM "Payment" p
      JOIN "Branch" b ON b.id = p.branch_id
      WHERE b.organization_id = ${organizationId}
        AND p.status = 'PAID'
        AND p.paid_at >= ${from}
      GROUP BY DATE(p.paid_at)
      ORDER BY date ASC
    `;

    return data;
  }

  // ── Member Growth Chart ───────────────────────────────────
  async getMemberGrowth(organizationId: string, months: number = 6) {
    const from = new Date();
    from.setMonth(from.getMonth() - months);

    const data = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_members
      FROM "Member"
      WHERE branch_id IN (
        SELECT id FROM "Branch" WHERE organization_id = ${organizationId}
      )
      AND created_at >= ${from}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    return data;
  }
}
