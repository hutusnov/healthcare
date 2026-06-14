package com.example.appointment.api;

import com.uithealthcare.domain.doctor.DoctorRespone;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Query;

public interface DoctorService {
    @GET("api/doctors/available")
    Call<DoctorRespone> getAvailableDoctors(
            @Query("day") String day,
            @Query("specialty") String specialty
    );
}
