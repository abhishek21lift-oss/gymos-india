import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private otpService: OtpService,
  ) {}

  // ── Send OTP ─────────────────────────────────────────────
  async sendOtp(phone: string, organizationSlug?: string) {
    const user = await this.prisma.user.findFirst({
      where: { phone },
      include: { organization: true },
    });

    // Also check if member
    const member = !user
      ? await this.prisma.member.findFirst({ where: { phone } })
      : null;

    if (!user && !member) {
      throw new NotFoundException('Phone number not registered');
    }

    const otp = this.otpService.generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpCode: otp, otpExpiry: expiry },
      });
    }

    // Send OTP via SMS / WhatsApp
    await this.otpService.sendOtp(phone, otp);

    return { message: 'OTP sent successfully', phone };
  }

  // ── Verify OTP ────────────────────────────────────────────
  async verifyOtp(phone: string, otp: string) {
    const user = await this.prisma.user.findFirst({
      where: { phone },
      include: {
        organization: true,
        branch: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.otpCode || user.otpCode !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      throw new UnauthorizedException('OTP expired. Please request a new one');
    }

    // Clear OTP
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiry: null, lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.role, user.organizationId);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId,
        branchId: user.branchId,
        organization: user.organization,
      },
    };
  }

  // ── Password Login (Owner backup) ─────────────────────────
  async loginWithPassword(phone: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { phone },
      include: { organization: true, branch: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.role, user.organizationId);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId,
        branchId: user.branchId,
      },
    };
  }

  // ── Refresh Token ─────────────────────────────────────────
  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });

    return this.generateTokens(user.id, user.role, user.organizationId);
  }

  // ── Generate Tokens ───────────────────────────────────────
  private async generateTokens(userId: string, role: string, orgId: string) {
    const payload = { sub: userId, role, orgId };

    const accessToken = this.jwt.sign(payload, { expiresIn: '1d' });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  // ── Get Profile ───────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        branch: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const { passwordHash, otpCode, otpExpiry, ...profile } = user;
    return profile;
  }
}
