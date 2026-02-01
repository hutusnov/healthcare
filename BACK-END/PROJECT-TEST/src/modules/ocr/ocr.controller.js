/**
 * OCR Controller - Google Cloud Vision
 * Xử lý OCR CCCD qua Google Cloud Vision API
 */

const multer = require('multer');
const { ocrWithGoogleVision } = require('../services/vision-ocr.service');
const R = require('../utils/response');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WebP, BMP are allowed.'));
        }
    }
});

/**
 * POST /api/ocr/cccd
 * Upload ảnh CCCD và trả về thông tin OCR
 */
async function ocrCCCD(req, res) {
    try {
        if (!req.file) {
            return R.error(res, 'No file uploaded', 400);
        }

        const result = await ocrWithGoogleVision(req.file.buffer);

        return R.success(res, {
            filename: req.file.originalname,
            ...result
        });

    } catch (error) {
        console.error('OCR Error:', error.message);

        const isProduction = process.env.NODE_ENV === 'production';
        const message = isProduction ? 'OCR processing failed' : error.message;

        return R.error(res, message, 500);
    }
}

/**
 * GET /api/ocr/health
 * Health check cho OCR service
 */
function healthCheck(req, res) {
    const hasApiKey = !!process.env.GOOGLE_CLOUD_VISION_API_KEY;

    return R.success(res, {
        status: 'ok',
        provider: 'Google Cloud Vision',
        configured: hasApiKey
    });
}

module.exports = {
    upload,
    ocrCCCD,
    healthCheck
};
