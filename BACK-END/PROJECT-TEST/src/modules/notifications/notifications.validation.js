const { z } = require('zod');

const sendReminders = z.object({
  hoursAhead: z.number().int().min(1).max(72).default(24),
  minHours: z.number().int().min(0).max(48).default(3),
});

module.exports = { sendReminders };
