package com.example.records.ui;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.records.R;
import com.example.records.adapter.RecordAdapter;
import com.example.records.api.CareProfileService;
import com.example.records.model.ItemRecord;
import com.example.results.ui.ChooseResultActivity;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.button.MaterialButton;
import com.uithealthcare.domain.careProfile.CareProfile;
import com.uithealthcare.domain.careProfile.CareProfilesResponse;
import com.uithealthcare.network.ApiServices;
import com.uithealthcare.network.SessionInterceptor;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RecordsActivity extends AppCompatActivity {
    private RecyclerView rcv;
    private String token;
    private CareProfileService careProfileService;
    private final List<ItemRecord> itemRecords = new ArrayList<>();

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.records_activity);

        SharedPreferences sp = getSharedPreferences("app_prefs", MODE_PRIVATE);
        token = sp.getString("access_token", null);
        careProfileService = ApiServices.create(CareProfileService.class, new SessionInterceptor.TokenProvider() {
            @Override
            public String getToken() {
                return token;
            }
        });

        MaterialButton btnBack = findViewById(R.id.btnBack);
        btnBack.setOnClickListener(v -> finish());

        MaterialButton btnCreateRecord = findViewById(R.id.btnCreateRecord);
        btnCreateRecord.setOnClickListener(v -> startActivity(
                new Intent(RecordsActivity.this, com.example.appointment.ui.CreateProfileActivity.class)
        ));

        rcv = findViewById(R.id.recyclerView);
        rcv.setLayoutManager(new LinearLayoutManager(this));
    }

    @Override
    protected void onResume() {
        super.onResume();
        showOnCardRecord();
    }

    private void showOnCardRecord() {
        if (token == null || token.trim().isEmpty()) {
            Toast.makeText(this, "Khong tim thay token, vui long dang nhap lai", Toast.LENGTH_SHORT).show();
            return;
        }

        careProfileService.showOnCardCareProfile().enqueue(new Callback<CareProfilesResponse>() {
            @Override
            public void onResponse(Call<CareProfilesResponse> call, Response<CareProfilesResponse> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    Log.d("RecordsActivity", "API error: " + response.code());
                    Toast.makeText(
                            RecordsActivity.this,
                            "Khong tai duoc danh sach ho so (" + response.code() + ")",
                            Toast.LENGTH_SHORT
                    ).show();
                    return;
                }

                CareProfilesResponse data = response.body();
                itemRecords.clear();

                if (data.isSuccess() && data.getData() != null) {
                    for (CareProfile care : data.getData()) {
                        itemRecords.add(new ItemRecord(
                                care.getId(),
                                safe(care.getFullName()),
                                genCareId(care.getId()),
                                safe(care.getPhone()),
                                safe(care.getRelation()),
                                formatDob(care.getDob()),
                                safe(care.getGender()),
                                safe(care.getProvince()),
                                safe(care.getDistrict()),
                                safe(care.getWard()),
                                safe(care.getAddress())
                        ));
                    }
                }

                RecordAdapter adapter = new RecordAdapter(itemRecords);
                rcv.setAdapter(adapter);
                adapter.setOnItemClickListener(RecordsActivity.this::showProfileActionBottomSheet);
            }

            @Override
            public void onFailure(Call<CareProfilesResponse> call, Throwable throwable) {
                Log.d("RecordsActivity", "showOnCardRecord failure: " + throwable.getMessage());
                Toast.makeText(RecordsActivity.this, "Loi ket noi may chu", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void showProfileActionBottomSheet(ItemRecord item) {
        BottomSheetDialog bottomSheetDialog = new BottomSheetDialog(this);
        View view = getLayoutInflater().inflate(R.layout.bottom_sheet_profile_actions, null);
        bottomSheetDialog.setContentView(view);

        MaterialButton btnViewInfo = view.findViewById(R.id.btnViewInfo);
        MaterialButton btnViewResult = view.findViewById(R.id.btnViewResult);
        MaterialButton btnViewHistory = view.findViewById(R.id.btnViewHistory);
        MaterialButton btnClose = view.findViewById(R.id.btnClose);

        btnViewInfo.setOnClickListener(v -> {
            Intent data = new Intent(this, ProfileActivity.class);
            data.putExtra("name", item.getName());
            data.putExtra("dob", item.getDob());
            data.putExtra("gender", item.getGender());
            data.putExtra("phone", item.getPhone());
            data.putExtra("relation", item.getRelation());
            data.putExtra("province", item.getProvince());
            data.putExtra("district", item.getDistrict());
            data.putExtra("ward", item.getWard());
            data.putExtra("addressDetail", item.getAddressDetail());
            startActivity(data);
            bottomSheetDialog.dismiss();
        });

        btnViewResult.setOnClickListener(v -> {
            Intent data = new Intent(this, ChooseResultActivity.class);
            data.putExtra("careProfileId", item.getCareProfileId());
            data.putExtra("careProfileName", item.getName());
            startActivity(data);
            bottomSheetDialog.dismiss();
        });

        btnViewHistory.setOnClickListener(v -> {
            Intent intent = new Intent(this, AppointmentHistoryActivity.class);
            intent.putExtra("careProfileId", item.getCareProfileId());
            intent.putExtra("name", item.getName());
            startActivity(intent);
            bottomSheetDialog.dismiss();
        });

        btnClose.setOnClickListener(v -> bottomSheetDialog.dismiss());
        bottomSheetDialog.show();
    }

    private String genCareId(String careProfileId) {
        if (careProfileId == null || careProfileId.isEmpty()) return "HS";
        String tail = careProfileId.length() > 4
                ? careProfileId.substring(careProfileId.length() - 4)
                : careProfileId;
        return "HS_" + tail.toUpperCase();
    }

    private String formatDob(String isoDate) {
        if (isoDate == null || isoDate.length() < 10) return "";
        return isoDate.substring(0, 10).replace("-", "/");
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
