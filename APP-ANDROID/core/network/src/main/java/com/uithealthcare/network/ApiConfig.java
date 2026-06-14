package com.uithealthcare.network;

public final class ApiConfig {
    private ApiConfig(){}

    // Đổi 1 chỗ là xong
//    public static final String BASE_URL = "https://uithealthcare.id.vn/"; // hoặc http://<IP>:4000
    public static final String BASE_URL = "http://healthcare-backend-alb-1504175061.ap-southeast-1.elb.amazonaws.com/";
//    public static final String OCR = "https://uithealthcare.id.vn/";
    public static final String OCR = BuildConfig.OCR_BASE_URL;

//     IP genymotion 10.0.3.2
// 192.168.252.156
}
