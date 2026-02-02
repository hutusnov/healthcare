/**
 * OCR Routes - Google Cloud Vision
 */

const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const ocrController = require('./ocr.controller');

// Health check (public)
router.get('/health', ocrController.healthCheck);

// OCR CCCD (requires authentication)
router.post(
    '/cccd',
    auth,
    ocrController.upload.single('file'),
    ocrController.ocrCCCD
);

module.exports = router;
