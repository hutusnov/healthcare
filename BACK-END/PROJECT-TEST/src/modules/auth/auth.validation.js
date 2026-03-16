const { z } = require('zod');

const login = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const register = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['PATIENT', 'DOCTOR', 'ADMIN']).default('PATIENT'),
  specialty: z.string().min(2).optional(),
}).refine(
  (data) => data.role !== 'DOCTOR' || (data.specialty && data.specialty.length >= 2),
  { message: 'specialty is required for DOCTOR role', path: ['specialty'] }
);

const requestReset = z.object({ email: z.string().email() });

const reset = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6),
});

module.exports = { login, register, requestReset, reset };
