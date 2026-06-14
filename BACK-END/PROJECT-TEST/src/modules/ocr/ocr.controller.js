const axios = require('axios');

const MAX_UPLOAD_BYTES = Number(process.env.OCR_MAX_FILE_SIZE_MB || 10) * 1024 * 1024;
const DEFAULT_OCR_HOST = process.env.OCR_INTERNAL_HOST || '192.168.100.169';
const DEFAULT_OCR_SCHEME = process.env.OCR_INTERNAL_SCHEME || 'http';
const DEFAULT_OCR_PORTS = (process.env.OCR_INTERNAL_PORTS || '30081,30082,8001')
  .split(',')
  .map((port) => port.trim())
  .filter(Boolean);

function getDefaultOcrUrls() {
  return DEFAULT_OCR_PORTS.map((port) => `${DEFAULT_OCR_SCHEME}://${DEFAULT_OCR_HOST}:${port}`);
}

function getOcrUrls() {
  const raw = process.env.OCR_SERVICE_URLS || process.env.OCR_SERVICE_URL || '';
  const configured = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : getDefaultOcrUrls();
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) {
        reject(Object.assign(new Error('OCR upload is too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function forwardToOcr(baseUrl, body, contentType) {
  const headers = {
    'Content-Type': contentType,
    'Content-Length': body.length,
  };

  if (process.env.OCR_API_KEY) {
    headers['X-API-Key'] = process.env.OCR_API_KEY;
  }

  return axios.post(`${baseUrl.replace(/\/$/, '')}/ocr-cccd`, body, {
    headers,
    maxBodyLength: MAX_UPLOAD_BYTES,
    timeout: Number(process.env.OCR_TIMEOUT_MS || 120000),
    validateStatus: () => true,
  });
}

async function scanCccd(req, res) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    return res.status(400).json({
      success: false,
      message: 'OCR request must be multipart/form-data',
    });
  }

  let body;
  try {
    body = await readRequestBody(req);
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Invalid OCR upload',
    });
  }

  const errors = [];
  for (const baseUrl of getOcrUrls()) {
    try {
      const response = await forwardToOcr(baseUrl, body, contentType);
      if (response.status < 500) {
        return res.status(response.status).json(response.data);
      }
      errors.push(`${baseUrl}: HTTP ${response.status}`);
    } catch (error) {
      errors.push(`${baseUrl}: ${error.code || error.message}`);
    }
  }

  return res.status(502).json({
    success: false,
    message: 'OCR service is unavailable',
    detail: process.env.NODE_ENV === 'production' ? undefined : errors,
  });
}

module.exports = {
  scanCccd,
};
