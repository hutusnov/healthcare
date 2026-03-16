const { z } = require('zod');

const cuid = z.string().regex(/^c[0-9a-z]{24}$/);

const available = z.object({
  doctorProfileId: cuid,
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const book = z.object({
  slotId: z.string().min(1),
  service: z.string().min(2),
  careProfileId: z.string().optional(),
});

const cancel = z.object({
  reason: z.string().optional().nullable(),
});

const calendar = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  specialty: z.string().optional().nullable(),
});

module.exports = { available, book, cancel, calendar };
