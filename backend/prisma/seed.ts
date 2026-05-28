import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GymOS India database...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-gym' },
    update: {},
    create: {
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
  console.log('✅ Organization created:', org.name);

  // 2. Create Branch
  const branch = await prisma.branch.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'GYM-01' } },
    update: {},
    create: {
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
  console.log('✅ Branch created:', branch.name);

  // 3. Create Owner
  const ownerPlainPassword = process.env.SEED_OWNER_PASSWORD || 'Gym@1234';
  const ownerPass = await bcrypt.hash(ownerPlainPassword, 10);
  const owner = await prisma.user.upsert({
    where: { organizationId_phone: { organizationId: org.id, phone: '9876543210' } },
    update: {},
    create: {
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
  console.log('✅ Owner created:', owner.name);
  console.log('📱 Owner phone: 9876543210');

  // 4. Create Trainers
  const trainers = [
    { name: 'Rahul Sharma', phone: '9111111111', spec: ['Strength Training', 'Powerlifting'], exp: 5, comm: 15 },
    { name: 'Priya Singh', phone: '9222222222', spec: ['Yoga', 'Zumba', 'Weight Loss'], exp: 3, comm: 12 },
    { name: 'Vikram Patel', phone: '9333333333', spec: ['Bodybuilding', 'Nutrition'], exp: 7, comm: 18 },
  ];

  const createdTrainers = [];
  for (const t of trainers) {
    const trainer = await prisma.user.upsert({
      where: { organizationId_phone: { organizationId: org.id, phone: t.phone } },
      update: {},
      create: {
        organizationId: org.id,
        branchId: branch.id,
        name: t.name,
        phone: t.phone,
        passwordHash: await bcrypt.hash(process.env.SEED_TRAINER_PASSWORD || 'Trainer@123', 10),
        role: 'TRAINER',
        gender: 'MALE',
        specialization: t.spec,
        experience: t.exp,
        commission: t.comm,
        rating: 4.2 + Math.random() * 0.6,
        isActive: true,
      },
    });
    createdTrainers.push(trainer);
  }
  console.log('✅ Trainers created:', createdTrainers.length);

  // 5. Create Membership Plans
  const plans = [
    { name: 'Monthly Basic', nameHindi: 'Mahina Sadharan', planType: 'MONTHLY', days: 30, price: 999 },
    { name: 'Monthly Premium', nameHindi: 'Mahina Premium', planType: 'MONTHLY', days: 30, price: 1499 },
    { name: 'Quarterly', nameHindi: 'Teen Mahine', planType: 'QUARTERLY', days: 90, price: 2499, popular: true },
    { name: '6 Months', nameHindi: 'Chhe Mahine', planType: 'HALF_YEARLY', days: 180, price: 4499 },
    { name: 'Annual', nameHindi: 'Saalaana', planType: 'YEARLY', days: 365, price: 7999 },
    { name: 'PT Package (12 Sessions)', nameHindi: 'PT Package', planType: 'PT_SESSION', days: 30, price: 3999, pt: true, ptSessions: 12 },
  ];

  const createdPlans = [];
  for (const p of plans) {
    const plan = await prisma.membershipPlan.create({
      data: {
        organizationId: org.id,
        name: p.name,
        nameHindi: p.nameHindi,
        planType: p.planType as any,
        durationDays: p.days,
        price: p.price,
        includesPT: p.pt || false,
        ptSessions: p.ptSessions || 0,
        isActive: true,
        isPopular: p.popular || false,
      },
    });
    createdPlans.push(plan);
  }
  console.log('✅ Plans created:', createdPlans.length);

  // 6. Create Sample Members
  const sampleMembers = [
    { name: 'Rajesh Kumar', phone: '9400000001', goal: 'WEIGHT_LOSS', weight: 85, height: 170 },
    { name: 'Sunita Devi', phone: '9400000002', goal: 'GENERAL_FITNESS', weight: 65, height: 160 },
    { name: 'Amit Singh', phone: '9400000003', goal: 'MUSCLE_GAIN', weight: 70, height: 175 },
    { name: 'Pooja Sharma', phone: '9400000004', goal: 'FLEXIBILITY', weight: 55, height: 162 },
    { name: 'Deepak Verma', phone: '9400000005', goal: 'STRENGTH', weight: 80, height: 178 },
    { name: 'Rekha Gupta', phone: '9400000006', goal: 'WEIGHT_LOSS', weight: 72, height: 158 },
    { name: 'Sandeep Yadav', phone: '9400000007', goal: 'MUSCLE_GAIN', weight: 68, height: 172 },
    { name: 'Kavita Joshi', phone: '9400000008', goal: 'GENERAL_FITNESS', weight: 60, height: 155 },
  ];

  for (let i = 0; i < sampleMembers.length; i++) {
    const m = sampleMembers[i];
    const memberId = `GYM-${String(i + 1).padStart(4, '0')}`;

    const member = await prisma.member.create({
      data: {
        branchId: branch.id,
        memberId,
        name: m.name,
        phone: m.phone,
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        goal: m.goal as any,
        currentWeight: m.weight,
        height: m.height,
        targetWeight: m.goal === 'WEIGHT_LOSS' ? m.weight - 10 : m.goal === 'MUSCLE_GAIN' ? m.weight + 8 : m.weight,
        trainerId: createdTrainers[i % 3].id,
        status: 'ACTIVE',
        loyaltyPoints: Math.floor(Math.random() * 500),
        totalVisits: Math.floor(Math.random() * 50),
        streakDays: Math.floor(Math.random() * 15),
      },
    });

    // Assign membership
    const plan = createdPlans[i % 4];
    const startDate = new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000);
    const endDate = new Date(startDate.getTime() + plan.durationDays * 86400000);

    await prisma.membership.create({
      data: {
        memberId: member.id,
        planId: plan.id,
        startDate,
        endDate,
        status: endDate > new Date() ? 'ACTIVE' : 'EXPIRED',
        amountPaid: plan.price,
        amountDue: 0,
      },
    });

    // Add some attendance records
    for (let d = 0; d < 10; d++) {
      const checkIn = new Date(Date.now() - d * 86400000);
      if (Math.random() > 0.3) {
        await prisma.attendance.create({
          data: {
            memberId: member.id,
            branchId: branch.id,
            checkInTime: checkIn,
            status: 'PRESENT',
            checkInMethod: Math.random() > 0.5 ? 'QR_SCAN' : 'MANUAL',
          },
        });
      }
    }

    // Add payment record
    await prisma.payment.create({
      data: {
        memberId: member.id,
        branchId: branch.id,
        receiptNumber: `REC-2024-${String(i + 1).padStart(5, '0')}`,
        amount: plan.price,
        gstAmount: 0,
        totalAmount: plan.price,
        method: i % 3 === 0 ? 'CASH' : i % 3 === 1 ? 'UPI' : 'RAZORPAY',
        status: 'PAID',
        paidAt: startDate,
      },
    });
  }
  console.log('✅ Sample members created:', sampleMembers.length);

  // 7. WhatsApp notification templates
  const templates = [
    {
      type: 'RENEWAL_REMINDER',
      channel: 'WHATSAPP',
      language: 'hi',
      name: 'Renewal Reminder - 7 Days Hindi',
      body: '🏋️ *Namaste {{member_name}}!*\n\nAapki membership agle *7 dinon mein* expire hone wali hai.\n\n📅 Expiry: *{{expiry_date}}*\n\nAbhi renew karein! 💪',
    },
    {
      type: 'WELCOME',
      channel: 'WHATSAPP',
      language: 'hi',
      name: 'Welcome Message Hindi',
      body: '🎉 *{{gym_name}} mein aapka swagat hai!*\n\n✅ Member ID: *{{member_id}}*\n🏋️ Plan: *{{plan_name}}*\n\nStay Strong! 💪',
    },
  ];

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: {
        organizationId_type_channel_language: {
          organizationId: org.id,
          type: t.type as any,
          channel: t.channel as any,
          language: t.language,
        },
      },
      update: {},
      create: { organizationId: org.id, ...t as any, isActive: true, isDefault: true },
    });
  }
  console.log('✅ Notification templates created');

  // 8. Org settings
  await prisma.organizationSettings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
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
  console.log('✅ Organization settings created');

  console.log('\n🎉 Seeding complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏋️  Gym: 619 Fitness Studio');
  console.log('🌐 Frontend: http://localhost:3000');
  console.log('🔧 API: http://localhost:3001/api/docs');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  Change default passwords immediately after first login!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
