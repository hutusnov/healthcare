// src/middlewares/validate.js
// Generic Zod validator middleware
module.exports = (schema, where = 'body') => (req, res, next) => {
  const data = req[where];
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map(i => i.message);
    return res.status(422).json({ success: false, message: 'Validation error', details });
  }
  req[where] = result.data; // cleaned/transformed data
  next();
};
