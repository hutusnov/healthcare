package com.example.appointment.ui;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.widget.EditText;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.appointment.R;
import com.example.appointment.api.SpecialtyService;
import com.example.appointment.model.ItemSpecialty;
import com.example.appointment.adapter.SpecialtyAdapter;
import com.google.android.material.button.MaterialButton;
import com.uithealthcare.domain.appointment.AppointmentInfo;
import com.uithealthcare.domain.appointment.AppointmentRequest;
import com.uithealthcare.domain.specialty.Specialty;
import com.uithealthcare.domain.specialty.SpecialtyRespone;
import com.uithealthcare.network.ApiServices;
import com.uithealthcare.network.SessionInterceptor;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SpecialtyActivity extends AppCompatActivity {

    private SharedPreferences sp;
    private String TOKEN = null;

    private RecyclerView rV;
    private MaterialButton btnBack;

    private List<ItemSpecialty> specialtyList, specialtyFiltered;

    private AppointmentRequest req;

    private AppointmentInfo appointmentInfo;

    private EditText edtSearch;
    private SpecialtyAdapter adapter;
    private SpecialtyService specialtyService;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.specialty_activity);

        req = (AppointmentRequest) getIntent().getSerializableExtra(AppointmentRequest.EXTRA);
        appointmentInfo = (AppointmentInfo) getIntent().getSerializableExtra(AppointmentInfo.EXTRA);

        rV = findViewById(R.id.specialtyRecyclerView);
        rV.setLayoutManager(new LinearLayoutManager(this));

        btnBack = findViewById(R.id.btnBack);
        btnBack.setOnClickListener(v -> finish());
        edtSearch = findViewById(R.id.edtSearch);
        edtSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}

            @Override
            public void afterTextChanged(Editable s) {
                filterSpecialty(s.toString());
            }
        });

        specialtyList = new ArrayList<>();
        specialtyService = ApiServices.create(SpecialtyService.class, new SessionInterceptor.TokenProvider() {
            @Override
            public String getToken() {
                return null;
            }
        });

        showOnSpecialtyCard();
    }

    private void showOnSpecialtyCard(){
        specialtyService.getListSpecialty().enqueue(new Callback<SpecialtyRespone>() {
            @Override
            public void onResponse(Call<SpecialtyRespone> call, Response<SpecialtyRespone> response) {
                SpecialtyRespone data = response.body();
                if(data != null && data.isSuccess()){
                    List<Specialty> list = data.getData();
                    for (Specialty spec : list){
                        specialtyList.add(new ItemSpecialty(spec.getName(), spec.getFee()));
                    }
                }
                specialtyFiltered = new ArrayList<>(specialtyList);
                adapter = new SpecialtyAdapter(specialtyFiltered);
                rV.setAdapter(adapter);
                adapter.setOnSpecialtyClickListener(item -> {
                    Intent i = new Intent(SpecialtyActivity.this, ChooseDateActivity.class);

                    req.setService(item.getName());
                    appointmentInfo.setSpecialty(item.getName());
                    appointmentInfo.setPrice(item.getPrice());

                    i.putExtra(AppointmentRequest.EXTRA, req);
                    i.putExtra(AppointmentInfo.EXTRA, appointmentInfo);
                    Log.d("Req", "Đã có specialty: "+ req.getService());
                    startActivity(i);
                });
            }

            @Override
            public void onFailure(Call<SpecialtyRespone> call, Throwable t) {
                Log.d("API", "showOSpecialtyCare Failure");
            }
        });
    }

    private void filterSpecialty(String keyword) {
        keyword = keyword.trim().toLowerCase();

        if (keyword.isEmpty()) {
            // trả về full list
            specialtyFiltered = new ArrayList<>(specialtyList);
        } else {
            List<ItemSpecialty> temp = new ArrayList<>();
            for (ItemSpecialty item : specialtyList) {
                if (item.getName().toLowerCase().contains(keyword)) {
                    temp.add(item);
                }
            }
            specialtyFiltered = temp;
        }
        adapter.updateList(specialtyFiltered);
    }
}
