/**
 * OCR Routes - Google Cloud Vision
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth');
const ocrController = require('./ocr.controller');

// Health check (public)
router.get('/health', ocrController.healthCheck);

// OCR CCCD (requires authentication)
router.post(
    '/cccd',
    authenticate,
    ocrController.upload.single('file'),
    ocrController.ocrCCCD
);

module.exports = router;
