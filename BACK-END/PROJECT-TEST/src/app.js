// src/app.js
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middlewares/error');
const { register, metricsMiddleware } = require('./utils/metrics');

// Routers
const authRoutes = require('./modules/auth/auth.routes');
const patientRoutes = require('./modules/patients/patients.routes');
const doctorRoutes = require('./modules/doctors/doctors.routes');
const apptRoutes = require('./modules/appointments/appointments.routes');
const paymentRoutes = require('./modules/payments/payments.routes');
const notifRoutes = require('./modules/notifications/notifications.routes');
const userRoutes = require('./modules/users/users.routes');
const careProfileRoutes = require('./modules/careProfiles/careProfiles.routes');
const locationRoutes = require('./modules/locations/locations.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const publicRoutes = require('./modules/public/public.routes');

const app = express();

// ========== SECURITY: CORS Whitelist ==========
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_PANEL_URL || 'http://localhost:5173',
    process.env.PATIENT_PORTAL_URL || 'http://localhost:5174',
    'https://uithealthcare.id.vn'
];

// ========== SECURITY: Rate Limiting ==========
const authLimiter = rateLimit(
{
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Quá nhiều lần thử, vui lòng thử lại sau 15 phút' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit(
{
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' },
});

// Core middlewares
app.use(helmet());
app.use(cors(
{
    origin: (origin, callback) =>
    {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin))
        {
            callback(null, true);
        }
        else
        {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Serve static files
app.use(express.static('public'));

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) =>
{
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Request metrics tracking
app.use(metricsMiddleware);

// Root redirect
app.get('/', (req, res) =>
{
    res.redirect('/api/health');
});

// Health
app.get('/api/health', (req, res) =>
{
    res.status(200).json(
    {
        success: true,
        message: 'Server is running'
    });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', apptRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/users', userRoutes);
app.use('/api/care-profiles', careProfileRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Errors
app.use(notFound);
app.use(errorHandler);

module.exports = app;
