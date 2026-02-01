package com.uithealthcare.network;

public final class ApiConfig {
    private ApiConfig() {
    }

    // Backend API URL
    public static final String BASE_URL = "https://api.hutusnov.id.vn/api/"; // hoặc http://<IP>:4000

    // OCR endpoint - now uses Backend API (Google Cloud Vision)
    // No separate OCR server needed!
    public static final String OCR_ENDPOINT = BASE_URL + "ocr/cccd";

    // IP genymotion 10.0.3.2
    // 192.168.252.156
}
