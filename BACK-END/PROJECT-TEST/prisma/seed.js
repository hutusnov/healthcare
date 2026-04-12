// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { addMinutes } = require('date-fns');


const prisma = new PrismaClient();


async function main() {
  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@demo.local' },
    update: {},
    create: {
      email: 'admin@demo.local',
      password: await bcrypt.hash('Admin@123', 10),
      fullName: 'System Admin',
      role: 'ADMIN'
    }
  });

  // Doctor
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@demo.local' },
    update: {},
    create: {
      email: 'doctor@demo.local',
      password: await bcrypt.hash('Doctor@123', 10),
      fullName: 'Dr. John Doe',
      role: 'DOCTOR'
    }
  });

  const doctorProfile = await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    update: {
      specialty: 'Cardiology',
      bio: 'Heart specialist with 10+ years experience.',
      yearsExperience: 10,
      clinicName: 'Demo Heart Clinic'
    },
    create: {
      userId: doctorUser.id,
      specialty: 'Cardiology',
      bio: 'Heart specialist with 10+ years experience.',
      yearsExperience: 10,
      clinicName: 'Demo Heart Clinic'
    }
  });

  // Patient
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@demo.local' },
    update: {},
    create: {
      email: 'patient@demo.local',
      password: await bcrypt.hash('Patient@123', 10),
      fullName: 'Jane Patient',
      phone: '0900000001',
      role: 'PATIENT'
    }
  });

  await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {
      gender: 'Female',
      address: 'Thu Duc, Ho Chi Minh City',
      emergencyContact: '0900000002'
    },
    create: {
      userId: patientUser.id,
      dob: new Date('1998-06-15T00:00:00.000Z'),
      gender: 'Female',
      address: 'Thu Duc, Ho Chi Minh City',
      emergencyContact: '0900000002'
    }
  });

  let careProfile = await prisma.careProfile.findFirst({
    where: {
      ownerId: patientUser.id,
      fullName: 'Jane Patient',
      relation: 'Bản thân'
    }
  });

  if (!careProfile) {
    careProfile = await prisma.careProfile.create({
      data: {
        ownerId: patientUser.id,
        fullName: 'Jane Patient',
        relation: 'Bản thân',
        dob: new Date('1998-06-15T00:00:00.000Z'),
        gender: 'Female',
        phone: '0900000001',
        email: 'patient@demo.local',
        address: 'Thu Duc, Ho Chi Minh City',
        note: 'Demo patient profile for app testing'
      }
    });
  }

  // Create some slots starting from the next half-hour
  const now = new Date();
  const slots = [];
  let cursor = addMinutes(now, 30);
  for (let i = 0; i < 6; i++) {
    const start = cursor;
    const end = addMinutes(start, 30);
    slots.push({ doctorId: doctorProfile.userId, start, end });
    cursor = end;
  }

  await prisma.doctorSlot.createMany({
    data: slots,
    skipDuplicates: true
  });

  const bookedSlot = await prisma.doctorSlot.findFirst({
    where: { doctorId: doctorProfile.userId },
    orderBy: { start: 'asc' }
  });

  if (!bookedSlot) {
    throw new Error('No doctor slot found for demo appointment');
  }

  let appointment = await prisma.appointment.findFirst({
    where: {
      patientId: patientUser.id,
      slotId: bookedSlot.id
    }
  });

  if (!appointment) {
    appointment = await prisma.appointment.create({
      data: {
        patientId: patientUser.id,
        doctorId: doctorUser.id,
        careProfileId: careProfile.id,
        slotId: bookedSlot.id,
        service: 'Khám tim mạch tổng quát',
        scheduledAt: bookedSlot.start,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        qrCode: 'DEMO-QR-CARDIOLOGY'
      }
    });
  } else {
    appointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        careProfileId: careProfile.id,
        doctorId: doctorUser.id,
        service: 'Khám tim mạch tổng quát',
        scheduledAt: bookedSlot.start,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        qrCode: 'DEMO-QR-CARDIOLOGY'
      }
    });
  }

  await prisma.doctorSlot.update({
    where: { id: bookedSlot.id },
    data: { isBooked: true }
  });

  await prisma.payment.upsert({
    where: { appointmentId: appointment.id },
    update: {
      provider: 'DEMO',
      amount: 300000,
      currency: 'VND',
      providerRef: 'DEMO-PAYMENT-001',
      status: 'PAID',
      meta: { seeded: true }
    },
    create: {
      appointmentId: appointment.id,
      provider: 'DEMO',
      amount: 300000,
      currency: 'VND',
      providerRef: 'DEMO-PAYMENT-001',
      status: 'PAID',
      meta: { seeded: true }
    }
  });

}

main()
  .catch(e => {
	console.error(e);
	process.exit(1);
  })
  .finally(async () => {
	await prisma.$disconnect();
  });
