const prisma = require('../../config/db');
const { notifyCancelled } = require('../notifications/notifications.service');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** Helpers: range trong ngày theo giờ VN (+07:00) để lọc slot chính xác */
const TZ = '+07:00';
const startOfDayISO = (day) => new Date(`${day}T00:00:00${TZ}`);
const endOfDayISO   = (day) => new Date(`${day}T23:59:59.999${TZ}`);

function dayRange(dayISO) {
  return { start: startOfDayISO(dayISO), end: endOfDayISO(dayISO) };
}

/**
 * Lấy slot TRỐNG của 1 bác sĩ theo ngày
 * @param {string} doctorUserId  // DoctorProfile.userId (== User.id của bác sĩ)
 * @param {string?} dayISO       // YYYY-MM-DD (giờ VN)
 */
async function availableSlots(doctorUserId, dayISO) {
  const where = { doctorId: doctorUserId, isBooked: false };
  if (dayISO) {
    const { start, end } = dayRange(dayISO);
    where.start = { gte: start };
    where.end   = { lte: end };
  }
  return prisma.doctorSlot.findMany({
    where,
    orderBy: { start: 'asc' }
  });
}

/**
 * Bệnh nhân đặt lịch cho 1 slot (có thể gắn careProfileId)
 * - verify careProfile thuộc owner
 * - verify slot tồn tại, chưa book, chưa quá khứ
 * - transaction: lock slot + create appointment
 */
async function book({ patientId, slotId, service, careProfileId }) {
  // (0) validate service
  if (!service || typeof service !== 'string' || !service.trim()) {
    throw httpError(400, 'Invalid service');
  }

  // (1) verify careProfile thuộc về patient (nếu có)
  if (careProfileId) {
    const cp = await prisma.careProfile.findUnique({
      where: { id: careProfileId },
      select: { ownerId: true }
    });
    if (!cp || cp.ownerId !== patientId) throw httpError(404, 'Care profile not found');
  }

  // (2) lấy slot và suy ra bác sĩ (DoctorProfile.userId)
  const slot = await prisma.doctorSlot.findUnique({
    where: { id: slotId },
    include: { doctor: { select: { userId: true } } } // doctor = DoctorProfile
  });
  if (!slot) throw httpError(404, 'Slot not found');
  if (slot.isBooked) throw httpError(409, 'Slot already booked');
  if (slot.start <= new Date()) throw httpError(400, 'Slot is in the past');

  // (3) transaction: chốt slot nếu còn trống rồi tạo appointment
  return prisma.$transaction(async (tx) => {
    const upd = await tx.doctorSlot.updateMany({
      where: { id: slotId, isBooked: false },
      data: { isBooked: true }
    });
    if (upd.count !== 1) throw httpError(409, 'Slot already booked');

    return tx.appointment.create({
      data: {
        patientId,
        careProfileId: careProfileId ?? null,
        doctorId: slot.doctor.userId,   // User.id của bác sĩ
        slotId,
        service: service.trim(),
        scheduledAt: slot.start,
        status: 'PENDING',
        paymentStatus: 'REQUIRES_PAYMENT'
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor:  { select: { id: true, fullName: true, email: true } },
        slot:    { select: { id: true, start: true, end: true, isBooked: true } },
        careProfile: true,
        payment: true
      }
    });
  });
}

/**
 * Bệnh nhân hủy lịch của chính mình
 * - mở lại slot nếu có
 * - gửi notification cho bệnh nhân & bác sĩ
 */
async function cancel({ appointmentId, byUserId, reason }) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { id: true, fullName: true } },
      doctor:  { select: { id: true, fullName: true } },
    }
  });
  if (!appt) throw httpError(404, 'Appointment not found');
  if (appt.patientId !== byUserId) throw httpError(403, 'Forbidden');

  const updated = await prisma.$transaction(async (tx) => {
    if (appt.slotId) {
      await tx.doctorSlot.update({ where: { id: appt.slotId }, data: { isBooked: false } });
    }
    return tx.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED', cancelReason: reason || 'Cancelled by patient' }
    });
  });

  // notifications
  await notifyCancelled({
    patientId: appt.patientId,
    doctorId:  appt.doctorId,
    appointment: {
      id: appt.id,
      service: appt.service,
      scheduledAt: appt.scheduledAt,
      patientName: appt.patient.fullName,
      doctorName:  appt.doctor.fullName
    },
    reason
  });

  return updated;
}

/**
 * Trả về danh sách ngày (YYYY-MM-DD) trong tháng có slot trống,
 * lọc theo specialty nếu có.
 * Flow FE: chọn tháng + (optional) chuyên khoa → những ngày có thể đặt.
 */
async function daysWithAvailability({ specialty, month }) {
  // Khoảng thời gian [month-01 00:00:00+07, month+1 00:00:00+07)
  const start = new Date(`${month}-01T00:00:00${TZ}`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  // Lọc danh sách bác sĩ theo specialty (exact match cho fixed list)
  const doctors = await prisma.doctorProfile.findMany({
    where: specialty ? { specialty } : {},
    select: { userId: true }
  });
  if (!doctors.length) return [];

  // Lọc slots trống của các bác sĩ trong khoảng tháng
  const slots = await prisma.doctorSlot.findMany({
    where: {
      doctorId: { in: doctors.map(d => d.userId) },
      isBooked: false,
      start: { gte: start, lt: end }
    },
    select: { start: true }
  });

  // Kết thành set các ngày (cắt theo phần ngày UTC từ ISO string)
  const set = new Set(slots.map(s => s.start.toISOString().slice(0, 10)));
  return Array.from(set).sort();
}

module.exports = {
  availableSlots,
  book,
  cancel,
  daysWithAvailability,
};
