import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TrainersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId, role: 'TRAINER', isActive: true },
      select: {
        id: true, name: true, phone: true, email: true,
        specialization: true, experience: true, bio: true,
        rating: true, commission: true, profilePhotoUrl: true,
        isActive: true, branchId: true,
        _count: { select: { trainedMembers: true, ptSessions: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const trainer = await this.prisma.user.findUnique({
      where: { id },
      include: {
        trainedMembers: {
          where: { isActive: true, status: 'ACTIVE' },
          select: { id: true, name: true, phone: true, memberId: true, goal: true },
          take: 20,
        },
        ptSessions: {
          orderBy: { scheduledAt: 'desc' },
          take: 10,
          include: { member: { select: { name: true, phone: true } } },
        },
        attendance: {
          orderBy: { checkInTime: 'desc' },
          take: 30,
        },
        _count: {
          select: { trainedMembers: true, ptSessions: true },
        },
      },
    });
    if (!trainer) throw new NotFoundException('Trainer not found');
    const { passwordHash, otpCode, otpExpiry, ...safe } = trainer as any;
    return safe;
  }

  async getStats(trainerId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeMembers, completedSessions, monthAttendance, avgRating] = await Promise.all([
      this.prisma.member.count({ where: { trainerId, status: 'ACTIVE', isActive: true } }),
      this.prisma.pTSession.count({ where: { trainerId, isCompleted: true } }),
      this.prisma.trainerAttendance.count({
        where: { trainerId, checkInTime: { gte: monthStart } },
      }),
      this.prisma.pTSession.aggregate({
        where: { trainerId, memberRating: { not: null } },
        _avg: { memberRating: true },
      }),
    ]);

    return {
      activeMembers,
      completedSessions,
      monthAttendance,
      avgRating: avgRating._avg.memberRating || 0,
    };
  }

  async update(id: string, dto: any) {
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async scheduleSession(dto: {
    memberId: string;
    trainerId: string;
    scheduledAt: Date;
    duration?: number;
    notes?: string;
  }) {
    return this.prisma.pTSession.create({ data: { ...dto, duration: dto.duration || 60 } });
  }

  async completeSession(sessionId: string, rating?: number, feedback?: string) {
    return this.prisma.pTSession.update({
      where: { id: sessionId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        memberRating: rating,
        memberFeedback: feedback,
      },
    });
  }
}
