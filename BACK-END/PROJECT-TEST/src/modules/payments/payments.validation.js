const { z } = require('zod');

const momoCreate = z.object({ appointmentId: z.string().min(1) });

module.exports = { momoCreate };
