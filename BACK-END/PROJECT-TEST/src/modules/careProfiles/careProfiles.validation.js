// src/modules/careProfiles/careProfiles.validation.js
const { z } = require('zod');

// Base fields (UI yêu cầu)
const baseFields = {
  fullName: z.string().min(2, 'Tên đầy đủ không được để trống'),
  relation: z.string().min(1, 'Quan hệ không được để trống'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh không hợp lệ'),

  // Optional
  phone: z.any().optional(),
  country: z.any().optional(),
  gender: z.any().optional(),
  email: z.any().optional(),
  insuranceNo: z.any().optional(),
  note: z.any().optional(),
};

// Nhóm địa chỉ theo "tên"
const nameAddressFields = {
  province: z.string().optional(),
  district: z.string().optional(),
  ward: z.string().optional(),
  address: z.string().optional(),
};

// Nhóm địa chỉ theo "mã"
const codeAddressFields = {
  provinceCode: z.string().optional(),
  districtCode: z.string().optional(),
  wardCode: z.string().optional(),
  addressDetail: z.string().optional(),
};

/**
 * Tạo mới:
 * - Bắt buộc base fields.
 * - Địa chỉ: CHỌN 1 TRONG 2 CÁCH
 *    (A) province + district + ward + address
 *    (B) provinceCode + districtCode + wardCode + addressDetail
 */
const create = z.object({
  ...baseFields,
  ...nameAddressFields,
  ...codeAddressFields,
}).refine((value) => {
  const hasCodes = !!(value.provinceCode || value.districtCode || value.wardCode || value.addressDetail);
  if (hasCodes) {
    return !!(value.provinceCode && value.districtCode && value.wardCode && value.addressDetail);
  }
  return !!(value.province && value.district && value.ward && value.address);
}, {
  message: 'Phải cung cấp đầy đủ province/district/ward/address hoặc provinceCode/districtCode/wardCode/addressDetail',
});

/**
 * Cập nhật: Cho phép partial update
 */
const update = z.object({
  fullName: z.string().min(2).optional(),
  relation: z.string().min(1).optional(),
  phone: z.string().regex(/^[0-9+\s\-().]{6,20}$/).optional(),
  country: z.string().min(2).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  email: z.string().email().optional().nullable(),
  insuranceNo: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  ...nameAddressFields,
  ...codeAddressFields,
}).refine((value) => {
  const hasAnyCode = !!(value.provinceCode || value.districtCode || value.wardCode || value.addressDetail);
  const hasAnyName = !!(value.province || value.district || value.ward || value.address);

  if (hasAnyCode) {
    return !!(value.provinceCode && value.districtCode && value.wardCode && value.addressDetail);
  }
  if (hasAnyName) {
    return !!(value.province && value.district && value.ward && value.address);
  }
  return true;
}, {
  message: 'Khi cập nhật địa chỉ, phải cung cấp đầy đủ nhóm province hoặc nhóm provinceCode',
});

/* -------------------- WRAPPERS -------------------- */
function run(schema, payload) {
  const result = schema.safeParse(payload);
  return {
    ok: result.success,
    errors: result.success ? [] : result.error.issues.map(i => i.message),
    value: result.success ? result.data : payload,
  };
}

function validateCreate(payload) {
  return run(create, payload);
}

function validateUpdate(payload) {
  return run(update, payload);
}

module.exports = { create, update, validateCreate, validateUpdate };
