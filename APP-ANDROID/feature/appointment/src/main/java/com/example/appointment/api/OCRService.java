package com.example.appointment.api;


import com.uithealthcare.domain.ocr.OcrResponse;

import okhttp3.MultipartBody;
import retrofit2.Call;
import retrofit2.http.Multipart;
import retrofit2.http.POST;
import retrofit2.http.Part;

public interface OCRService {
    @Multipart
    @POST("api/ocr/cccd")
    Call<OcrResponse> uploadCccd(
            @Part MultipartBody.Part file
    );
}
