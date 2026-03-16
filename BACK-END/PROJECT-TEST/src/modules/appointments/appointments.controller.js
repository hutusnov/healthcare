const R = require('../../utils/apiResponse');
const svc = require('./appointments.service');

/**
 * Lấy các slot trống của 1 bác sĩ theo ngày (sau khi người dùng đã chọn bác sĩ)
 * Query:
 *  - doctorId:  User.id của bác sĩ (cũng là DoctorProfile.userId)
 *  - day:       YYYY-MM-DD (tùy chọn)
 *
 * (Giữ tương thích cũ: nếu client còn gửi doctorProfileId thì vẫn nhận)
 */
async function available(req, res) {
  const doctorId = req.query.doctorId || req.query.doctorProfileId;
  const { day } = req.query;
  if (!doctorId) return R.badRequest(res, 'doctorId is required');
  const slots = await svc.availableSlots(doctorId, day);
  return R.ok(res, slots);
}

/**
 * Đặt lịch khám cho 1 slot, có thể gắn careProfileId (phải thuộc owner = patient hiện tại)
 * Body:
 *  - slotId (required)
 *  - service (required)
 *  - careProfileId (optional)
 */
async function book(req, res) {
  const { slotId, service, careProfileId } = req.body;
  if (!slotId || !service) {
    return R.badRequest(res, 'slotId, service are required');
  }
  const appt = await svc.book({
    patientId: req.user.id,
    slotId,
    service,
    careProfileId
  });
  return R.created(res, appt, 'Appointment created, proceed to payment');
}

/** Bệnh nhân hủy lịch của chính mình */
async function cancel(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  const appt = await svc.cancel({ appointmentId: id, byUserId: req.user.id, reason });
  return R.ok(res, appt, 'Appointment cancelled');
}

/**
 * Lịch “có slot trống” theo tháng (dùng để tô ngày có lịch, sau bước chọn chuyên khoa)
 * Query:
 *  - month: YYYY-MM (required)
 *  - specialty: string (optional, lọc theo chuyên khoa; MySQL case-insensitive theo collation)
 */
async function calendar(req, res) {
  const { month, specialty } = req.query;
  if (!month) return R.badRequest(res, 'month is required (YYYY-MM)');
  // Strict validation: must match YYYY-MM format
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return R.badRequest(res, 'month must be in YYYY-MM format (e.g. 2026-03)');
  }
  try {
    const days = await svc.daysWithAvailability({ specialty, month });
    return R.ok(res, days);
  } catch (e) {
    console.error(e);
    return R.error(res, e.message || 'Failed to load calendar');
  }
}

module.exports = { available, book, cancel, calendar };
