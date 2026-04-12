// src/modules/payments/payments.controller.js
const R = require('../../utils/apiResponse');
const svc = require('./payments.service');
const prisma = require('../../config/db');

// Tạo payment MoMo cho 1 appointment
async function momoCreate(req, res) {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) return R.badRequest(res, 'appointmentId is required');

    const data = await svc.createMoMoForAppointment({
      appointmentId,
      byUserId: req.user.id,
    });

    return R.ok(res, data);
  } catch (e) {
    console.error('momoCreate error:', e);
    if (e.status === 403) return R.forbidden(res, e.message);
    if (e.status === 404) return R.notFound(res, e.message);
    if (e.status === 409) return R.conflict(res, e.message);
    if (e.status === 502) return res.status(502).json({ success: false, message: e.message || 'Payment provider error' });
    return R.badRequest(res, e.message || 'MoMo create error');
  }
}

// IPN (public, không auth)
async function momoNotify(req, res) {
  try {
    const result = await svc.handleMomoIPN(req.body);
    // MoMo IPN spec: luôn trả 200, kèm resultCode & message
    return res.json({ resultCode: result.code, message: result.msg });
  } catch (e) {
    console.error('momoNotify error:', e);
    return res
      .status(200)
      .json({ resultCode: 99, message: e.message || 'Error' });
  }
}

// RETURN URL từ MoMo (browser redirect sau khi thanh toán xong)
// SECURITY: This is READ-ONLY — it does NOT alter payment state.
// State is only altered by the IPN webhook (momoNotify) which verifies MoMo signatures.
async function momoReturn(req, res) {
  try {
    const { orderId, resultCode } = req.query;

    if (!orderId) {
      return R.badRequest(res, 'Missing orderId');
    }

    // Read-only: just look up current status from the database
    const status = await svc.getPaymentStatus(orderId);

    if (!status.ok) {
      return R.badRequest(res, status.msg || 'Payment not found');
    }

    // Return the current state for the frontend to display
    return R.ok(res, {
      ...status,
      momoResultCode: resultCode,
    }, 'Payment status retrieved');
  } catch (e) {
    console.error('MoMo return error:', e);
    return R.badRequest(res, e.message || 'Error');
  }
}

// (tuỳ chọn) API phiếu khám / hoá đơn dạng JSON (không phải PDF)
// dùng cho app nếu muốn show thông tin trước khi tải PDF
async function receipt(req, res) {
  try {
    const { id } = req.params; // appointment id

    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        slot: true,
        careProfile: true,
        payment: true,
      },
    });

    if (!appt) return R.notFound(res, 'Appointment not found');

    // patient chỉ xem được hoá đơn của chính mình
    if (req.user.role === 'PATIENT' && appt.patientId !== req.user.id) {
      return R.forbidden(res);
    }

    if (appt.paymentStatus !== 'PAID') {
      return R.badRequest(res, 'Payment not completed');
    }

    const dp = await prisma.doctorProfile.findUnique({
      where: { userId: appt.doctorId },
    });
    const specialty = dp?.specialty || 'GENERAL';

    return R.ok(res, {
      receiptNo: appt.payment?.id || appt.id,
      patientName: appt.careProfile?.fullName || appt.patient.fullName,
      specialty,
      examDate: appt.slot?.start,
      examTime: appt.slot
        ? { start: appt.slot.start, end: appt.slot.end }
        : null,
      clinicRoom: dp?.clinicName || 'Phòng khám',
      amount: appt.payment?.amount,
      bookedAt: appt.createdAt,
    });
  } catch (e) {
    console.error('receipt error:', e);
    return R.badRequest(res, e.message || 'Error');
  }
}

module.exports = {
  momoCreate,
  momoNotify,
  momoReturn,
  receipt,
};
