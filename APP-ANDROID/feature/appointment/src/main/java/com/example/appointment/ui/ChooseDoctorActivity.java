package com.example.appointment.ui;

import android.content.Intent;
import android.health.connect.datatypes.AppInfo;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.appointment.R;
import com.example.appointment.adapter.DoctorScheduleAdapter;
import com.example.appointment.api.DoctorService;
import com.example.appointment.model.DoctorSchedule;
import com.example.appointment.model.TimeSlot;
import com.google.android.material.button.MaterialButton;
import com.uithealthcare.domain.appointment.AppointmentInfo;
import com.uithealthcare.domain.appointment.AppointmentRequest;
import com.uithealthcare.domain.doctor.Doctor;
import com.uithealthcare.domain.doctor.DoctorRespone;
import com.uithealthcare.domain.doctor.Slot;
import com.uithealthcare.network.ApiServices;
import com.uithealthcare.network.SessionInterceptor;

import java.text.ParseException;
import java.util.*;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ChooseDoctorActivity extends AppCompatActivity {
    private MaterialButton btnBack;
    private RecyclerView rvDoctors;
    private List<DoctorSchedule> list;

    private AppointmentRequest req;
    private AppointmentInfo appointmentInfo;
    private DoctorService doctorService;
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.choose_doctor_activity);

        req = (AppointmentRequest) getIntent().getSerializableExtra(AppointmentRequest.EXTRA);
        appointmentInfo = (AppointmentInfo) getIntent().getSerializableExtra(AppointmentInfo.EXTRA);

        btnBack = findViewById(R.id.btnBack);
        btnBack.setOnClickListener(v -> finish());

        rvDoctors = findViewById(R.id.rvDoctors);
        rvDoctors.setLayoutManager(new LinearLayoutManager(this));
        rvDoctors.setHasFixedSize(true);

        list = new ArrayList<>();
        doctorService = ApiServices.create(DoctorService.class, new SessionInterceptor.TokenProvider() {
            @Override
            public String getToken() {
                return null;
            }
        });
        showDoctorSchedule();
    }

    private void showDoctorSchedule(){

        String day = appointmentInfo.getExamDate();
        String nameSpecialty = appointmentInfo.getSpecialty();
        list.clear();
        doctorService.getAvailableDoctors(day, nameSpecialty).enqueue(new Callback<DoctorRespone>() {
            @Override
            public void onResponse(Call<DoctorRespone> call, Response<DoctorRespone> response) {
                DoctorRespone doctorRespone = response.body();
                String[] parts = day.split("-"); // [2025, 12, 11]
                String formattedDate = parts[2] + "-" + parts[1] + "-" + parts[0]; // "11-12-2025"

                if(doctorRespone != null && doctorRespone.isSuccess()){
                    List<Doctor> listDoc = doctorRespone.getData();
                    for(Doctor doc : listDoc){
                        String nameDoc = doc.getFullName();
                        String nameClinic = doc.getClinicName();
                        List<Slot> listSlot = doc.getSlots();

                        List<TimeSlot> scheduleDoc = new ArrayList<>();
                        for(Slot slot : listSlot){
                            String slotId = slot.getId();
                            String startTime = null;
                            String endTime = null;
                            try {
                                startTime = slot.getStartTime();
                                endTime = slot.getEndTime();
                            } catch (ParseException e) {
                                throw new RuntimeException(e);
                            }

                            String time = startTime + " - " + endTime;
                            boolean available = true;

                            scheduleDoc.add(new TimeSlot(slotId, time, available));
                        }

                        list.add(new DoctorSchedule(nameDoc,
                                formattedDate, nameClinic, scheduleDoc));
                    }
                    DoctorScheduleAdapter adapter = new DoctorScheduleAdapter(list, (doctor, slot) -> {
                        Intent data = new Intent(ChooseDoctorActivity.this, BookingAppointmentActivity.class);

                        appointmentInfo.setClinic(doctor.location);
                        appointmentInfo.setExamHour(slot.time);
                        req.setSlotId(slot.getSlotId());

                        data.putExtra(AppointmentRequest.EXTRA, req);
                        data.putExtra(AppointmentInfo.EXTRA, appointmentInfo);
                        //Log.d("Req", "Đã có slotId: "+req.getSlotId());
                        startActivity(data);
                    });
                    rvDoctors.setAdapter(adapter);
                }
            }

            @Override
            public void onFailure(Call<DoctorRespone> call, Throwable throwable) {
                Log.d("API", "Show doctor schedule failure");
            }
        });
    }
}
