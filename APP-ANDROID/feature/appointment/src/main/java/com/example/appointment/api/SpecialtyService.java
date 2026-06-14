package com.example.appointment.api;

import com.uithealthcare.domain.specialty.SpecialtyRespone;

import retrofit2.Call;
import retrofit2.http.GET;

public interface SpecialtyService {
    @GET("api/doctors/specialties")
    Call<SpecialtyRespone> getListSpecialty();
}
