const prisma = require('../../config/db');
const UNPAID_EXPIRE_MINUTES = 10;
const REMINDER_WINDOW_DEFAULT_MINUTES = 5;

async function getProfile(userId) {
  return prisma.patientProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
}

async function upsertProfile(userId, payload) {
  return prisma.patientProfile.upsert({
    where: { userId },
    update: payload,
    create: { userId, ...payload },
  });
}

/// cleanup các lịch PENDING + REQUIRES_PAYMENT đã quá hạn của 1 patient
async function cleanupExpiredForPatient(patientId) {
  const cutoff = new Date(Date.now() - UNPAID_EXPIRE_MINUTES * 60 * 1000);

  const expired = await prisma.appointment.findMany({
    where: {
      patientId,
      status: 'PENDING',
      paymentStatus: 'REQUIRES_PAYMENT',
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      slotId: true,
    },
  });

  for (const appt of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        // nhả slot nếu có
        if (appt.slotId) {
          await tx.doctorSlot.update({
            where: { id: appt.slotId },
            data: { isBooked: false },
          });
        }

        // xoá payment liên quan
        await tx.payment.deleteMany({
          where: { appointmentId: appt.id },
        });

        // xoá appointment
        await tx.appointment.delete({
          where: { id: appt.id },
        });
      });
    } catch (e) {
      console.error('cleanupExpiredForPatient error', appt.id, e);
    }
  }
}

async function getAppointments(userId) {
  await cleanupExpiredForPatient(userId);
  return prisma.appointment.findMany({
    where: { patientId: userId },
    include: { doctor: true, payment: true, careProfile: true },
    orderBy: { scheduledAt: 'desc' },
  });
}

// CHỈ appointment đã thanh toán, mới nhất lên trước
async function getPaidAppointments(userId) {
  return prisma.appointment.findMany({
    where: {
      patientId: userId,
      paymentStatus: 'PAID',
    },
    include: {
      doctor: true,
      payment: true,
      careProfile: true,
    },
    // sort theo thời gian cập nhật (thường là lúc thanh toán xong)
    orderBy: { updatedAt: 'desc' },
  });
}

// ========== UPCOMING REMINDERS (nhắc lịch trước X phút) ==========
async function getUpcomingAppointmentReminders(
  patientId,
  withinMinutes = REMINDER_WINDOW_DEFAULT_MINUTES
) {
  // giới hạn trong khoảng 1..60 phút cho safe
  const windowMinutes = Math.min(
    Math.max(parseInt(withinMinutes, 10) || REMINDER_WINDOW_DEFAULT_MINUTES, 1),
    60
  );

  const now = new Date();
  const to = new Date(now.getTime() + windowMinutes * 60 * 1000);

  const items = await prisma.appointment.findMany({
    where: {
      patientId,
      // logic nhắc lịch: thường là lịch đã CONFIRMED + PAID
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      scheduledAt: {
        gte: now,
        lte: to,
      },
    },
    include: {
      doctor: true,
      careProfile: true,
      payment: true,
    },
    orderBy: { scheduledAt: 'asc' },
  });

  // map ra JSON gọn cho bên app
  return items.map((appt) => {
    const diffMs = appt.scheduledAt.getTime() - now.getTime();
    const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);

    return {
      id: appt.id,
      service: appt.service,
      scheduledAt: appt.scheduledAt, // ra ISO string khi JSON
      timeUntilStartMinutes: diffMinutes,
      status: appt.status,
      paymentStatus: appt.paymentStatus,
      doctor: appt.doctor
        ? {
            id: appt.doctor.id,
            fullName: appt.doctor.fullName,
            email: appt.doctor.email,
            phone: appt.doctor.phone,
          }
        : null,
      careProfile: appt.careProfile
        ? {
            id: appt.careProfile.id,
            fullName: appt.careProfile.fullName,
            relation: appt.careProfile.relation,
          }
        : null,
      payment: appt.payment
        ? {
            id: appt.payment.id,
            amount: appt.payment.amount,
            currency: appt.payment.currency,
            status: appt.payment.status,
          }
        : null,
    };
  });
}

// CHỈ trả về các lịch đã có examResult (kết quả khám)
async function getAppointmentResults(userId) {
  const items = await prisma.appointment.findMany({
    where: {
      patientId: userId,
      examResult: { not: null },
    },
    include: {
      doctor: true,
      careProfile: true,
    },
    orderBy: { scheduledAt: 'desc' },
  });

  return items.map((appt) => ({
    id: appt.id,
    service: appt.service,
    scheduledAt: appt.scheduledAt,
    status: appt.status,
    examResult: appt.examResult || '',
    treatmentPlan: appt.treatmentPlan || '',   // <--- MỚI

    doctor: appt.doctor
      ? {
          id: appt.doctor.id,
          fullName: appt.doctor.fullName,
          email: appt.doctor.email,
        }
      : null,
    careProfile: appt.careProfile
      ? {
          id: appt.careProfile.id,
          fullName: appt.careProfile.fullName,
          relation: appt.careProfile.relation,
        }
      : null,
  }));
}


module.exports = {
  getProfile,
  upsertProfile,
  getAppointments,
  getPaidAppointments,
  getUpcomingAppointmentReminders,
  getAppointmentResults, // <--- nhớ export
};
