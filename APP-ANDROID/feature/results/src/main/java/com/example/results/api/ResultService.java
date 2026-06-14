package com.example.results.api;

import com.uithealthcare.domain.result.ResultResponse;

import retrofit2.Call;
import retrofit2.http.GET;

public interface ResultService {
    @GET("api/patient/appointments/results")
    Call<ResultResponse> getResults();
}
