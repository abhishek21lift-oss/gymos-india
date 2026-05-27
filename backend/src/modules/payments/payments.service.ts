import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as Razorpay from 'razorpay';
import * as crypto from 'crypto';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PaymentsService {
  private razorpay: any;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: config.get('RAZORPAY_KEY_ID'),
      key_secret: config.get('RAZORPAY_KEY_SECRET'),
    });
  }

  // ── Create Razorpay Order ─────────────────────────────────
  async createOrder(memberId: string, amount: number, membershipId?: string) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member not found');

    const order = await this.razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { memberId, memberName: member.name, membershipId },
    });

    // Create pending payment record
    const receiptNumber = await this.generateReceiptNumber(member.branchId);
    const payment = await this.prisma.payment.create({
      data: {
        memberId,
        branchId: member.branchId,
        membershipId,
        receiptNumber,
        amount,
        gstAmount: 0,
        totalAmount: amount,
        method: 'RAZORPAY',
        status: 'PENDING',
        razorpayOrderId: order.id,
      },
    });

    return { order, payment };
  }

  // ── Verify Razorpay Payment ───────────────────────────────
  async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, signature: string) {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSig = crypto
      .createHmac('sha256', this.config.get('RAZORPAY_KEY_SECRET'))
      .update(body)
      .digest('hex');

    if (expectedSig !== signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const payment = await this.prisma.payment.update({
      where: { razorpayOrderId },
      data: {
        razorpayPaymentId,
        status: 'PAID',
        paidAt: new Date(),
      },
      include: { member: true },
    });

    // Activate membership if linked
    if (payment.membershipId) {
      await this.prisma.membership.update({
        where: { id: payment.membershipId },
        data: { status: 'ACTIVE', amountDue: 0 },
      });
    }

    return payment;
  }

  // ── Record Cash Payment ───────────────────────────────────
  async recordCashPayment(dto: {
    memberId: string;
    amount: number;
    membershipId?: string;
    collectedBy: string;
    notes?: string;
    gstAmount?: number;
  }) {
    const member = await this.prisma.member.findUnique({ where: { id: dto.memberId } });
    if (!member) throw new NotFoundException('Member not found');

    const receiptNumber = await this.generateReceiptNumber(member.branchId);
    const totalAmount = dto.amount + (dto.gstAmount || 0);

    const payment = await this.prisma.payment.create({
      data: {
        memberId: dto.memberId,
        branchId: member.branchId,
        membershipId: dto.membershipId,
        receiptNumber,
        amount: dto.amount,
        gstAmount: dto.gstAmount || 0,
        totalAmount,
        method: 'CASH',
        status: 'PAID',
        paidAt: new Date(),
        collectedBy: dto.collectedBy,
        notes: dto.notes,
      },
      include: { member: true, membership: { include: { plan: true } } },
    });

    return payment;
  }

  // ── Record UPI Payment ────────────────────────────────────
  async recordUpiPayment(dto: {
    memberId: string;
    amount: number;
    upiTransactionId: string;
    upiId?: string;
    membershipId?: string;
    collectedBy: string;
  }) {
    const member = await this.prisma.member.findUnique({ where: { id: dto.memberId } });
    if (!member) throw new NotFoundException('Member not found');

    const receiptNumber = await this.generateReceiptNumber(member.branchId);

    return this.prisma.payment.create({
      data: {
        memberId: dto.memberId,
        branchId: member.branchId,
        membershipId: dto.membershipId,
        receiptNumber,
        amount: dto.amount,
        gstAmount: 0,
        totalAmount: dto.amount,
        method: 'UPI',
        status: 'PAID',
        paidAt: new Date(),
        upiTransactionId: dto.upiTransactionId,
        upiId: dto.upiId,
        collectedBy: dto.collectedBy,
      },
    });
  }

  // ── Get Payment History ───────────────────────────────────
  async getPaymentHistory(branchId: string, query: any) {
    const { page = 1, limit = 20, status, method, startDate, endDate, memberId } = query;
    const skip = (page - 1) * limit;

    const where: any = { branchId };
    if (status) where.status = status;
    if (method) where.method = method;
    if (memberId) where.memberId = memberId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          member: { select: { id: true, name: true, phone: true, memberId: true } },
          membership: { include: { plan: { select: { name: true } } } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data: payments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Daily Revenue Summary ─────────────────────────────────
  async getDailySummary(branchId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const [payments, cashTotal, upiTotal, razorpayTotal, pendingTotal] = await Promise.all([
      this.prisma.payment.findMany({
        where: { branchId, createdAt: { gte: targetDate, lt: nextDay } },
        include: { member: { select: { name: true, memberId: true } } },
      }),
      this.prisma.payment.aggregate({
        where: { branchId, method: 'CASH', status: 'PAID', createdAt: { gte: targetDate, lt: nextDay } },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { branchId, method: 'UPI', status: 'PAID', createdAt: { gte: targetDate, lt: nextDay } },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { branchId, method: 'RAZORPAY', status: 'PAID', createdAt: { gte: targetDate, lt: nextDay } },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { branchId, status: 'PENDING' },
        _sum: { totalAmount: true },
      }),
    ]);

    const totalRevenue =
      (cashTotal._sum.totalAmount || 0) +
      (upiTotal._sum.totalAmount || 0) +
      (razorpayTotal._sum.totalAmount || 0);

    return {
      date: targetDate,
      totalRevenue,
      cash: cashTotal._sum.totalAmount || 0,
      upi: upiTotal._sum.totalAmount || 0,
      online: razorpayTotal._sum.totalAmount || 0,
      pendingAmount: pendingTotal._sum.totalAmount || 0,
      transactionCount: payments.length,
      transactions: payments,
    };
  }

  // ── Monthly Revenue ───────────────────────────────────────
  async getMonthlyRevenue(branchId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const daily = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        SUM(total_amount) FILTER (WHERE status = 'PAID') as revenue,
        COUNT(*) FILTER (WHERE status = 'PAID') as transactions
      FROM "Payment"
      WHERE branch_id = ${branchId}
        AND created_at BETWEEN ${start} AND ${end}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const totals = await this.prisma.payment.aggregate({
      where: { branchId, status: 'PAID', createdAt: { gte: start, lte: end } },
      _sum: { totalAmount: true },
      _count: true,
    });

    return {
      month, year,
      totalRevenue: totals._sum.totalAmount || 0,
      totalTransactions: totals._count,
      dailyBreakdown: daily,
    };
  }

  // ── Generate Receipt PDF ──────────────────────────────────
  async generateReceiptPdf(paymentId: string): Promise<Buffer> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        member: true,
        membership: { include: { plan: true } },
        branch: { include: { organization: true } },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text(payment.branch.organization.name, { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(payment.branch.address || '', { align: 'center' });
      doc.moveDown();

      // Receipt Title
      doc.fontSize(18).font('Helvetica-Bold').text('PAYMENT RECEIPT', { align: 'center' });
      doc.moveDown(0.5);

      // Receipt Info
      doc.fontSize(10).font('Helvetica');
      doc.text(`Receipt No: ${payment.receiptNumber}`);
      doc.text(`Date: ${payment.paidAt?.toLocaleDateString('en-IN') || new Date().toLocaleDateString('en-IN')}`);
      doc.moveDown();

      // Member Info
      doc.fontSize(12).font('Helvetica-Bold').text('Member Details');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${payment.member.name}`);
      doc.text(`Phone: ${payment.member.phone}`);
      doc.text(`Member ID: ${payment.member.memberId}`);
      doc.moveDown();

      // Payment Details
      doc.fontSize(12).font('Helvetica-Bold').text('Payment Details');
      doc.fontSize(10).font('Helvetica');
      if (payment.membership?.plan) {
        doc.text(`Plan: ${payment.membership.plan.name}`);
      }
      doc.text(`Amount: ₹${payment.amount.toFixed(2)}`);
      if (payment.gstAmount > 0) doc.text(`GST (18%): ₹${payment.gstAmount.toFixed(2)}`);
      doc.text(`Total: ₹${payment.totalAmount.toFixed(2)}`);
      doc.text(`Payment Method: ${payment.method}`);
      doc.text(`Status: ${payment.status}`);
      if (payment.upiTransactionId) doc.text(`UPI Ref: ${payment.upiTransactionId}`);
      doc.moveDown(2);

      // Footer
      doc.fontSize(8).text('Thank you for choosing us! Stay Fit, Stay Strong! 💪', { align: 'center' });
      doc.text('This is a computer generated receipt.', { align: 'center' });

      doc.end();
    });
  }

  // ── Helper: Receipt Number ────────────────────────────────
  private async generateReceiptNumber(branchId: string): Promise<string> {
    const count = await this.prisma.payment.count({ where: { branchId } });
    const year = new Date().getFullYear();
    return `REC-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
