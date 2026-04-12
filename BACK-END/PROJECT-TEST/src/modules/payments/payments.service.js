const axios = require('axios');
const crypto = require('crypto');
const prisma = require('../../config/db');
const config = require('../../config/env');
const { notifyBooked } = require('../notifications/notifications.service');
const { generateAppointmentQR } = require('../../utils/qr');
const QRCode = require('qrcode'); // generate QR cho payUrl
const { generateInvoicePdf } = require('../../utils/invoicePdf');
const { sendInvoiceEmail } = require('../../utils/invoiceEmail');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// --- helpers ---
function signRaw(raw, secretKey) {
  return crypto.createHmac('sha256', secretKey).update(raw).digest('hex');
}

function getFeeBySpecialty(specialty) {
  const name = String(specialty || '').trim();
  if (Array.isArray(config.specialties) && config.specialties.length) {
    const found = config.specialties.find(
      (s) => String(s.name).trim().toLowerCase() === name.toLowerCase(),
    );
    if (found && Number(found.fee)) return Math.max(1, Math.floor(Number(found.fee)));
  }
  const map = config.fees?.specialtyFees || {};
  const v = Number(map[name]) || Number(config.fees?.defaultSpecialtyFee || 150000);
  return Math.max(1, Math.floor(v));
}

function ensureMomoConfig() {
  const reqKeys = ['partnerCode', 'accessKey', 'secretKey', 'endpoint', 'returnUrl', 'notifyUrl'];
  const missing = reqKeys.filter((k) => !config.momo?.[k]);
  if (missing.length) throw httpError(400, `MoMo config missing: ${missing.join(', ')}`);
}

function trimTrailingSlash(u = '') {
  return String(u || '').replace(/\/+$/, '');
}


// ------------------ CREATE MOMO -----------------------
async function createMoMoForAppointment({ appointmentId, byUserId }) {
  ensureMomoConfig();

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { id: true, fullName: true } },
      doctor: { select: { id: true, fullName: true } },
      careProfile: true,
      slot: true,
    },
  });

  if (!appt) throw httpError(404, 'Appointment not found');
  if (appt.patientId !== byUserId) throw httpError(403, 'Forbidden');
  if (appt.status === 'CANCELLED') throw httpError(400, 'Appointment cancelled');
  if (appt.paymentStatus === 'PAID') throw httpError(409, 'Appointment already paid');

  const dp = await prisma.doctorProfile.findUnique({ where: { userId: appt.doctorId } });
  const specialty = dp?.specialty || 'GENERAL';
  const amount = getFeeBySpecialty(specialty);

  const provider = 'MOMO';
  const currency = 'VND';
  const orderIdBase = `APPT_${appointmentId}`;
  const orderId = `${orderIdBase}_${Date.now()}`;
  const requestId = `${orderId}_${Math.floor(Math.random() * 1000)}`;

  await prisma.payment.upsert({
    where: { appointmentId },
    update: { provider, amount, currency, status: 'REQUIRES_PAYMENT' },
    create: { appointmentId, provider, amount, currency, status: 'REQUIRES_PAYMENT' },
  });

  const endpoint = `${trimTrailingSlash(config.momo.endpoint)}/create`;
  const orderInfo = `Thanh toán đặt khám - ${specialty}`;
  const redirectUrl = config.momo.returnUrl;
  const ipnUrl = config.momo.notifyUrl;
  const requestType = 'captureWallet';

  const raw = `accessKey=${config.momo.accessKey}`
    + `&amount=${amount}`
    + `&extraData=`
    + `&ipnUrl=${ipnUrl}`
    + `&orderId=${orderId}`
    + `&orderInfo=${orderInfo}`
    + `&partnerCode=${config.momo.partnerCode}`
    + `&redirectUrl=${redirectUrl}`
    + `&requestId=${requestId}`
    + `&requestType=${requestType}`;

  const signature = signRaw(raw, config.momo.secretKey);

  const payload = {
    partnerCode: config.momo.partnerCode,
    accessKey: config.momo.accessKey,
    requestId,
    amount: String(amount),
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    requestType,
    extraData: '',
    lang: 'vi',
    signature,
  };

  try {
    const { data } = await axios.post(endpoint, payload, { timeout: 10000 });

    await prisma.payment.update({
      where: { appointmentId },
      data: {
        providerRef: data.transId ? String(data.transId) : null,
        meta: data,
      },
    });

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { paymentStatus: 'REQUIRES_PAYMENT' },
    });

    let qrImage = null;
    if (data.payUrl) {
      try {
        qrImage = await QRCode.toDataURL(data.payUrl);
      } catch (e) {
        console.error('QR generate error:', e);
      }
    }

    return {
      amount,
      orderInfo,
      payUrl: data.payUrl || null,
      qrImage,
      qrCodeUrl: data.qrCodeUrl || null,
      deeplink: data.deeplink || data.deeplinkWebInApp || null,
    };
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      const msg = (data && (data.message || data.localMessage)) || JSON.stringify(data);
      throw httpError(502, `MoMo ${status}: ${msg}`);
    }
    throw httpError(502, err.message || 'MoMo request failed');
  }
}


// ------------------ VERIFY SIGNATURE + IPN -----------------------
function verifyMomoSignature(params) {
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature,
  } = params;

  const raw = `accessKey=${config.momo.accessKey}`
    + `&amount=${amount ?? ''}`
    + `&extraData=${extraData ?? ''}`
    + `&message=${message ?? ''}`
    + `&orderId=${orderId ?? ''}`
    + `&orderInfo=${orderInfo ?? ''}`
    + `&orderType=${orderType ?? ''}`
    + `&partnerCode=${partnerCode ?? ''}`
    + `&payType=${payType ?? ''}`
    + `&requestId=${requestId ?? ''}`
    + `&responseTime=${responseTime ?? ''}`
    + `&resultCode=${resultCode ?? ''}`
    + `&transId=${transId ?? ''}`;

  const sign = signRaw(raw, config.momo.secretKey);
  return sign === signature;
}


// -------------- HANDLE MOMO IPN ----------------
// SECURITY: skipVerify removed — IPN must ALWAYS verify signatures
async function handleMomoIPN(body) {
  if (!verifyMomoSignature(body)) {
    return { ok: false, code: 97, msg: 'Signature mismatch' };
  }

  const { orderId, resultCode } = body;
  if (!orderId || !orderId.startsWith('APPT_')) {
    return { ok: false, code: 98, msg: 'Invalid orderId' };
  }

  const core = orderId.substring('APPT_'.length);
  const [appointmentId] = core.split('_');

  // trạng thái trước update để check chuyển từ chưa PAID -> PAID
  const apptBefore = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: true,
      careProfile: true,
      payment: true,
      slot: true,
    },
  });

  if (!apptBefore) return { ok: false, code: 99, msg: 'Appointment not found' };

  const paid = Number(resultCode) === 0;

  // update payment + appointment
  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { appointmentId },
      data: { status: paid ? 'PAID' : 'FAILED', meta: body },
    });
    await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: paid ? 'PAID' : 'FAILED',
        status: paid ? 'CONFIRMED' : 'PENDING',
      },
    });
  });

  // chỉ xử lý tiếp nếu thanh toán thành công
  if (paid && apptBefore.paymentStatus !== 'PAID') {
    // 1) gửi notifyBooked như cũ
    await notifyBooked({
      patientId: apptBefore.patientId,
      doctorId: apptBefore.doctorId,
      appointment: {
        id: appointmentId,
        service: apptBefore.service,
        scheduledAt: apptBefore.scheduledAt,
        patientName: apptBefore.patient?.fullName || 'Người bệnh',
        doctorName: apptBefore.doctor?.fullName || 'Bác sĩ',
      },
    });

    // 2) tạo + gửi invoice qua email
    try {
      const apptFull = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: true,
          doctor: true,
          careProfile: true,
          slot: true,
          payment: true,
        },
      });

      if (apptFull && apptFull.patient?.email && apptFull.payment) {
        // lấy specialty từ DoctorProfile để đưa vào invoice
        const dp = await prisma.doctorProfile.findUnique({
          where: { userId: apptFull.doctorId },
        });

        const apptForInvoice = dp
          ? { ...apptFull, doctorProfile: dp }
          : apptFull;

        const pdfBuffer = await generateInvoicePdf({
          appointment: apptForInvoice,
          payment: apptFull.payment,
        });

        await sendInvoiceEmail({
          to: apptFull.patient.email,
          pdfBuffer,
          filename: `invoice-${apptFull.payment.id || appointmentId}.pdf`,
          appointment: apptForInvoice,
          payment: apptFull.payment,
        });
      }
    } catch (err) {
      console.error('Send invoice email failed:', err);
    }
  }

  return { ok: true, code: 0, msg: 'OK' };
}


// ================== READ-ONLY PAYMENT STATUS ==================
// Used by momoReturn to display status WITHOUT mutating the database
async function getPaymentStatus(orderId) {
  if (!orderId || !orderId.startsWith('APPT_')) {
    return { ok: false, msg: 'Invalid orderId' };
  }

  const core = orderId.substring('APPT_'.length);
  const [appointmentId] = core.split('_');

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      service: true,
      scheduledAt: true,
      payment: { select: { amount: true, provider: true, status: true } },
    },
  });

  if (!appt) return { ok: false, msg: 'Appointment not found' };

  return {
    ok: true,
    appointmentId: appt.id,
    appointmentStatus: appt.status,
    paymentStatus: appt.paymentStatus,
    service: appt.service,
    scheduledAt: appt.scheduledAt,
    payment: appt.payment,
  };
}


// ================== FAKE PAYMENT ==================

async function createFakePayment({ appointmentId, byUserId }) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { id: true, fullName: true } },
      doctor: { select: { id: true, fullName: true } },
      slot: true,
    },
  });

  if (!appt) throw new Error('Appointment not found');
  if (appt.patientId !== byUserId) throw new Error('Forbidden');
  if (appt.status === 'CANCELLED') throw new Error('Appointment cancelled');
  if (appt.paymentStatus === 'PAID') throw new Error('Appointment already paid');

  const dp = await prisma.doctorProfile.findUnique({ where: { userId: appt.doctorId } });
  const specialty = dp?.specialty || 'GENERAL';
  const amount = getFeeBySpecialty(specialty);

  await prisma.payment.upsert({
    where: { appointmentId },
    update: { provider: 'FAKE', amount, currency: 'VND', status: 'REQUIRES_PAYMENT' },
    create: { appointmentId, provider: 'FAKE', amount, currency: 'VND', status: 'REQUIRES_PAYMENT' },
  });

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentStatus: 'REQUIRES_PAYMENT' },
  });

  const qrPayload = {
    appointmentId,
    amount,
    patientName: appt.patient?.fullName || null,
    doctorName: appt.doctor?.fullName || null,
    scheduledAt: appt.scheduledAt,
    fake: true,
  };

  const qrCode = await generateAppointmentQR(qrPayload);

  return { amount, specialty, qrCode };
}


async function confirmFakePayment({ appointmentId }) {
  const apptBefore = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: true,
      payment: true,
      careProfile: true,
    },
  });

  if (!apptBefore) throw new Error('Appointment not found');
  if (apptBefore.paymentStatus === 'PAID') {
    return { alreadyPaid: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { appointmentId },
      data: { status: 'PAID' },
    });
    await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
    });
  });

  const apptAfter = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: true,
      payment: true,
      careProfile: true,
    },
  });

  // notifyBooked như cũ
  await notifyBooked({
    patientId: apptAfter.patientId,
    doctorId: apptAfter.doctorId,
    appointment: {
      id: appointmentId,
      service: apptAfter.service,
      scheduledAt: apptAfter.scheduledAt,
      patientName: apptAfter.patient?.fullName || 'Người bệnh',
      doctorName: apptAfter.doctor?.fullName || 'Bác sĩ',
    },
  });

  // gửi invoice
  try {
    if (apptAfter?.patient?.email && apptAfter?.payment) {
      const dp = await prisma.doctorProfile.findUnique({
        where: { userId: apptAfter.doctorId },
      });

      const apptForInvoice = dp
        ? { ...apptAfter, doctorProfile: dp }
        : apptAfter;

      const pdfBuffer = await generateInvoicePdf({
        appointment: apptForInvoice,
        payment: apptAfter.payment,
      });

      await sendInvoiceEmail({
        to: apptAfter.patient.email,
        appointment: apptForInvoice,
        payment: apptAfter.payment,
        pdfBuffer,
        filename: `invoice-${apptAfter.payment.id || appointmentId}.pdf`,
      });
    }
  } catch (e) {
    console.error(
      'Failed to send invoice email (fake payment)',
      appointmentId,
      e,
    );
  }

  return { ok: true };
}


module.exports = {
  createMoMoForAppointment,
  handleMomoIPN,
  getPaymentStatus,
  createFakePayment,
  confirmFakePayment,
};
