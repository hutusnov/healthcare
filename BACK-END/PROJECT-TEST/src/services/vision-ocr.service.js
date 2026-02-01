/**
 * Google Cloud Vision OCR Service
 * Thay thế self-hosted VietOCR bằng Google Cloud Vision API
 * Free tier: 1000 requests/tháng
 */

const axios = require('axios');

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * Gọi Google Cloud Vision API để OCR ảnh
 * @param {Buffer|string} imageData - Base64 encoded image hoặc Buffer
 * @returns {Promise<{success: boolean, data: object, items: string[]}>}
 */
async function ocrWithGoogleVision(imageData) {
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

    if (!apiKey) {
        throw new Error('GOOGLE_CLOUD_VISION_API_KEY is not configured');
    }

    // Convert Buffer to base64 if needed
    const base64Image = Buffer.isBuffer(imageData)
        ? imageData.toString('base64')
        : imageData;

    const requestBody = {
        requests: [
            {
                image: {
                    content: base64Image
                },
                features: [
                    {
                        type: 'TEXT_DETECTION',
                        maxResults: 50
                    }
                ],
                imageContext: {
                    languageHints: ['vi', 'en']
                }
            }
        ]
    };

    try {
        const response = await axios.post(
            `${VISION_API_URL}?key=${apiKey}`,
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const result = response.data.responses[0];

        if (result.error) {
            throw new Error(result.error.message);
        }

        const fullText = result.fullTextAnnotation?.text || '';
        const items = result.textAnnotations?.map(t => t.description) || [];

        // Parse CCCD info from OCR text
        const cccdInfo = parseCCCDInfo(fullText);

        return {
            success: true,
            data: cccdInfo,
            items: items.slice(1), // Skip first item (full text)
            rawText: fullText
        };

    } catch (error) {
        console.error('Google Vision OCR error:', error.message);
        throw error;
    }
}

/**
 * Parse thông tin CCCD từ text OCR
 * @param {string} text - Full text từ OCR
 * @returns {object} Thông tin CCCD đã parse
 */
function parseCCCDInfo(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    const info = {
        idNumber: null,
        fullName: null,
        dateOfBirth: null,
        gender: null,
        nationality: 'Việt Nam',
        placeOfOrigin: null,
        placeOfResidence: null,
        expiryDate: null
    };

    // Patterns for Vietnamese CCCD
    const patterns = {
        idNumber: /(\d{12})/,
        dateOfBirth: /(\d{2}\/\d{2}\/\d{4})/,
        gender: /(Nam|Nữ|MALE|FEMALE)/i
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const upperLine = line.toUpperCase();

        // ID Number (12 digits)
        if (!info.idNumber) {
            const idMatch = line.match(patterns.idNumber);
            if (idMatch) {
                info.idNumber = idMatch[1];
            }
        }

        // Full Name - usually after "Họ và tên" or "Full name"
        if (upperLine.includes('HỌ VÀ TÊN') || upperLine.includes('FULL NAME')) {
            // Name is typically on the next line or after colon
            const namePart = line.split(':')[1]?.trim();
            if (namePart) {
                info.fullName = namePart;
            } else if (lines[i + 1]) {
                info.fullName = lines[i + 1].trim();
            }
        }

        // Date of Birth
        if (upperLine.includes('SINH') || upperLine.includes('BIRTH')) {
            const dobMatch = line.match(patterns.dateOfBirth);
            if (dobMatch) {
                info.dateOfBirth = dobMatch[1];
            }
        }

        // Gender
        const genderMatch = line.match(patterns.gender);
        if (genderMatch) {
            info.gender = genderMatch[1].toLowerCase() === 'nam' ||
                genderMatch[1].toLowerCase() === 'male' ? 'Nam' : 'Nữ';
        }

        // Place of Origin - after "Quê quán" or "Place of origin"
        if (upperLine.includes('QUÊ QUÁN') || upperLine.includes('PLACE OF ORIGIN')) {
            const originPart = line.split(':')[1]?.trim();
            if (originPart) {
                info.placeOfOrigin = originPart;
            } else if (lines[i + 1]) {
                info.placeOfOrigin = lines[i + 1].trim();
            }
        }

        // Place of Residence - after "Nơi thường trú"
        if (upperLine.includes('NƠI THƯỜNG TRÚ') || upperLine.includes('PLACE OF RESIDENCE')) {
            const residencePart = line.split(':')[1]?.trim();
            if (residencePart) {
                info.placeOfResidence = residencePart;
            } else if (lines[i + 1]) {
                info.placeOfResidence = lines[i + 1].trim();
            }
        }

        // Expiry Date
        if (upperLine.includes('CÓ GIÁ TRỊ ĐẾN') || upperLine.includes('DATE OF EXPIRY')) {
            const expiryMatch = line.match(patterns.dateOfBirth);
            if (expiryMatch) {
                info.expiryDate = expiryMatch[1];
            }
        }
    }

    return info;
}

module.exports = {
    ocrWithGoogleVision,
    parseCCCDInfo
};
