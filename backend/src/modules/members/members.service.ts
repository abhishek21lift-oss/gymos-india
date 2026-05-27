import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberQueryDto } from './dto/member-query.dto';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  // ── Create Member ─────────────────────────────────────────
  async create(dto: CreateMemberDto, branchId: string, createdBy: string) {
    // Check duplicate phone in branch
    const existing = await this.prisma.member.findFirst({
      where: { phone: dto.phone, branchId },
    });
    if (existing) {
      throw new ConflictException('Member with this phone already exists');
    }

    // Generate member ID
    const count = await this.prisma.member.count({ where: { branchId } });
    const memberId = `GYM-${String(count + 1).padStart(4, '0')}`;

    // Generate QR Code
    const qrData = `gymos:member:${uuidv4()}`;
    const qrCode = await QRCode.toDataURL(qrData);

    const member = await this.prisma.member.create({
      data: {
        ...dto,
        memberId,
        qrCode: qrData,
        branchId,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      include: {
        trainer: { select: { id: true, name: true, phone: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'CREATE_MEMBER',
        entity: 'Member',
        entityId: member.id,
        newValue: member as any,
      },
    });

    return { ...member, qrCodeImage: qrCode };
  }

  // ── Find All Members ──────────────────────────────────────
  async findAll(branchId: string, query: MemberQueryDto) {
    const {
      search,
      status,
      trainerId,
      page = 1,
      limit = 20,
      expiringIn,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = { branchId, isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { memberId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (trainerId) where.trainerId = trainerId;

    // Expiring members filter
    if (expiringIn) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + expiringIn);
      where.memberships = {
        some: {
          status: 'ACTIVE',
          endDate: { lte: targetDate, gte: new Date() },
        },
      };
    }

    const [members, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          trainer: { select: { id: true, name: true } },
          memberships: {
            where: { status: 'ACTIVE' },
            orderBy: { endDate: 'desc' },
            take: 1,
            include: { plan: true },
          },
          _count: { select: { attendance: true } },
        },
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      data: members,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Find One Member ───────────────────────────────────────
  async findOne(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        trainer: { select: { id: true, name: true, phone: true, profilePhotoUrl: true } },
        branch: { select: { id: true, name: true } },
        memberships: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        ptSessions: {
          include: { trainer: { select: { id: true, name: true } } },
          orderBy: { scheduledAt: 'desc' },
          take: 5,
        },
        bodyMetrics: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
        attendance: {
          orderBy: { checkInTime: 'desc' },
          take: 30,
        },
      },
    });

    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  // ── Update Member ─────────────────────────────────────────
  async update(id: string, dto: UpdateMemberDto, updatedBy: string) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) throw new NotFoundException('Member not found');

    const updated = await this.prisma.member.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'UPDATE_MEMBER',
        entity: 'Member',
        entityId: id,
        oldValue: member as any,
        newValue: updated as any,
      },
    });

    return updated;
  }

  // ── Delete / Deactivate Member ────────────────────────────
  async remove(id: string, removedBy: string) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) throw new NotFoundException('Member not found');

    await this.prisma.member.update({
      where: { id },
      data: { isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: removedBy,
        action: 'DELETE_MEMBER',
        entity: 'Member',
        entityId: id,
      },
    });

    return { message: 'Member deactivated successfully' };
  }

  // ── Assign Membership ─────────────────────────────────────
  async assignMembership(memberId: string, planId: string, startDate: Date, amountPaid: number) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Deactivate existing active membership
    await this.prisma.membership.updateMany({
      where: { memberId, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });

    const membership = await this.prisma.membership.create({
      data: {
        memberId,
        planId,
        startDate,
        endDate,
        status: 'ACTIVE',
        amountPaid,
        amountDue: plan.price - amountPaid,
        ptSessionsTotal: plan.ptSessions,
      },
      include: { plan: true },
    });

    // Update member status
    await this.prisma.member.update({
      where: { id: memberId },
      data: { status: 'ACTIVE' },
    });

    return membership;
  }

  // ── Get Member Stats ──────────────────────────────────────
  async getMemberStats(memberId: string) {
    const [member, totalPayments, lastAttendance, activeMembership] = await Promise.all([
      this.prisma.member.findUnique({
        where: { id: memberId },
        include: { _count: { select: { attendance: true, ptSessions: true } } },
      }),
      this.prisma.payment.aggregate({
        where: { memberId, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.attendance.findFirst({
        where: { memberId },
        orderBy: { checkInTime: 'desc' },
      }),
      this.prisma.membership.findFirst({
        where: { memberId, status: 'ACTIVE' },
        include: { plan: true },
      }),
    ]);

    const daysLeft = activeMembership
      ? Math.ceil((activeMembership.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      totalVisits: member?._count.attendance || 0,
      totalPTSessions: member?._count.ptSessions || 0,
      totalAmountPaid: totalPayments._sum.amount || 0,
      lastVisit: lastAttendance?.checkInTime || null,
      activeMembership,
      daysLeft: Math.max(0, daysLeft),
      streakDays: member?.streakDays || 0,
      loyaltyPoints: member?.loyaltyPoints || 0,
    };
  }

  // ── Search Members ────────────────────────────────────────
  async searchByPhone(phone: string, branchId: string) {
    return this.prisma.member.findFirst({
      where: { phone, branchId, isActive: true },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: { plan: true },
        },
      },
    });
  }

  // ── Generate QR ───────────────────────────────────────────
  async regenerateQr(memberId: string) {
    const qrData = `gymos:member:${uuidv4()}`;
    const qrCodeImage = await QRCode.toDataURL(qrData);

    await this.prisma.member.update({
      where: { id: memberId },
      data: { qrCode: qrData },
    });

    return { qrCode: qrData, qrCodeImage };
  }
}
