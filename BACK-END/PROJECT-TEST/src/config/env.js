// src/config/env.js
require('dotenv').config();

// ========== SECURITY: Environment Variable Validation ==========
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingEnvVars.length > 0) {
  console.error(`[CRITICAL] Missing required environment variables: ${missingEnvVars.join(', ')}`);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Warn if using weak/default JWT secret
if (process.env.JWT_SECRET === 'change_this_secret' || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('[SECURITY WARNING] JWT_SECRET is weak or default. Please use a strong secret (32+ characters) in production!');
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  dbUrl: process.env.DATABASE_URL,

  jwt: {
    secret: process.env.JWT_SECRET,
    expires: process.env.JWT_EXPIRES || '7d'
  },

  // MoMo (để sẵn, chưa dùng cũng không sao)
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE || '',
    accessKey: process.env.MOMO_ACCESS_KEY || '',
    secretKey: process.env.MOMO_SECRET_KEY || '',
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api',
    returnUrl: process.env.MOMO_RETURN_URL || '',
    notifyUrl: process.env.MOMO_NOTIFY_URL || ''
  },

  // ===== 10 chuyên khoa cố định + phí hiển thị =====
  specialties: [
    { name: 'BỆNH LÝ CỘT SỐNG', fee: 150000 },
    { name: 'DA LIỄU', fee: 150000 },
    { name: 'HUYẾT HỌC', fee: 150000 },
    { name: 'MẮT', fee: 150000 },
    { name: 'NGOẠI THẦN KINH', fee: 150000 },
    { name: 'TAI MŨI HỌNG', fee: 150000 },
    { name: 'THẦN KINH', fee: 150000 },
    { name: 'TIM MẠCH', fee: 150000 },
    { name: 'TƯ VẤN TÂM LÝ', fee: 150000 },
    { name: 'KHÁM VÀ TƯ VẤN DINH DƯỠNG', fee: 150000 }
  ],
  // <<< ADD: SMTP / MAIL >>>
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  mail: {
    fromName: process.env.MAIL_FROM_NAME || 'UIT Healthcare',
    fromEmail: process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || ''
  },
  // Fallback chung (nếu cần dùng nơi khác)
  fees: {
    defaultSpecialtyFee: 150000
  }
};

module.exports = config;