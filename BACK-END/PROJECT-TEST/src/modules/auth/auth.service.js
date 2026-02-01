// src/modules/auth/auth.service.js
const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const mailer = require('../../utils/mailer');

/**
 * Đăng nhập: kiểm tra email/password, trả JWT + thông tin user cơ bản.
 */
async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expires }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }
  };
}

/**
 * Đăng ký: tạo User + profile theo role.
 * - PATIENT  -> tạo PatientProfile.
 * - DOCTOR   -> tạo DoctorProfile.
 * Trả JWT để đăng nhập luôn.
 */
async function register({ email, password, fullName, role = 'PATIENT', specialty }) {
  // ========== SECURITY: Password Strength Validation ==========
  // Requires: 8+ chars, uppercase, lowercase, number, special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    const err = new Error('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)');
    err.status = 400;
    throw err;
  }

  // ========== SECURITY: Prevent Role Escalation ==========
  // Only PATIENT role is allowed for public registration
  // DOCTOR and ADMIN accounts must be created by admin
  const safeRole = 'PATIENT';
  if (role !== 'PATIENT') {
    console.warn(`[SECURITY] Blocked role escalation attempt: ${email} tried to register as ${role}`);
  }

  // 1) Email unique
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  // 2) Tạo user với role an toàn (luôn là PATIENT)
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, fullName, role: safeRole }
  });

  // 3) Tạo PatientProfile (vì chỉ cho phép PATIENT)
  await prisma.patientProfile.create({
    data: { userId: user.id }
  });

  // 4) JWT
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expires }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }
  };
}

/* ===================== RESET PASSWORD (Email code) ===================== */

/** Sinh mã 6 số */
function gen6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Gửi email chứa mã reset
 * - Cần các biến .env: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
async function sendResetCodeEmail(email, code) {
  const subject = 'Mã đặt lại mật khẩu - UIT Healthcare';
  const text = `Mã xác nhận đặt lại mật khẩu của bạn là: ${code}. Mã có hiệu lực trong 10 phút.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>Đặt lại mật khẩu</h2>
      <p>Xin chào <b>${email}</b>,</p>
      <p>Mã xác nhận của bạn là:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:3px;margin:8px 0 14px">${code}</div>
      <p>Mã có hiệu lực trong <b>10 phút</b>. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
      <hr/>
      <small>UIT Healthcare</small>
    </div>
  `;
  await mailer.sendMail({ to: email, subject, text, html });
}

/**
 * Yêu cầu đặt lại mật khẩu:
 * - Không tiết lộ email có tồn tại hay không.
 * - Hủy hiệu lực các mã cũ còn hạn.
 * - Tạo mã mới (hash trong DB), gửi email mã 6 số.
 */
async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { ok: true }; // tránh lộ thông tin
  }

  // Hủy hiệu lực các mã cũ còn hạn
  await prisma.passwordReset.updateMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() }
  });

  const code = gen6();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

  await prisma.passwordReset.create({
    data: { userId: user.id, codeHash, expiresAt }
  });

  try {
    await sendResetCodeEmail(email, code);
  } catch (e) {
    console.error('Send reset mail error:', e?.response?.data || e.message);
  }

  return { ok: true };
}

/**
 * Đặt lại mật khẩu với email + code + mật khẩu mới:
 * - Tìm mã reset còn hạn mới nhất, so khớp code.
 * - Đổi mật khẩu user, đánh dấu usedAt cho mã.
 */
async function resetPassword({ email, code, newPassword }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true };

  const pr = await prisma.passwordReset.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  });

  if (!pr) {
    const err = new Error('Invalid or expired code');
    err.status = 400;
    throw err;
  }

  const match = await bcrypt.compare(code, pr.codeHash);
  if (!match) {
    const err = new Error('Invalid or expired code');
    err.status = 400;
    throw err;
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.passwordReset.update({
      where: { id: pr.id },
      data: { usedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { password: newHash }
    })
  ]);

  return { ok: true };
}

module.exports = {
  login,
  register,
  requestPasswordReset,
  resetPassword
};
