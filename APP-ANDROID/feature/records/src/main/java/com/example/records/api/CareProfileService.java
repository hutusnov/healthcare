package com.example.records.api;

import com.uithealthcare.domain.careProfile.CareProfilesResponse;

import retrofit2.Call;
import retrofit2.http.GET;

public interface CareProfileService {
    @GET("api/care-profiles")
    Call<CareProfilesResponse> showOnCardCareProfile();
}
