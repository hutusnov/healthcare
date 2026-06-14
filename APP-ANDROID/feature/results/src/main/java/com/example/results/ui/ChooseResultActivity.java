package com.example.results.ui;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.results.R;
import com.example.results.adapter.ResultAdapter;
import com.example.results.api.ResultService;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.MaterialAutoCompleteTextView;
import com.uithealthcare.domain.result.ResultData;
import com.uithealthcare.domain.result.ResultResponse;
import com.uithealthcare.network.ApiServices;
import com.uithealthcare.network.SessionInterceptor;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ChooseResultActivity extends AppCompatActivity {

    private ImageView btnBack;
    private MaterialAutoCompleteTextView spinnerYear, spinnerMonth;
    private MaterialButton btnClear;
    private RecyclerView rvResults;
    private SharedPreferences sp;
    private String TOKEN = null;

    // filter theo CareProfile (nếu đi từ hồ sơ)
    private String careProfileIdFilter = null;
    private String careProfileName = null;

    private ResultAdapter adapter;
    private final List<ResultData> allResults = new ArrayList<>();
    private final List<ResultData> filteredResults = new ArrayList<>();

    private ResultService resultService;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.choose_result);

        //  token từ getSharedPreferences tag
        sp = getSharedPreferences("app_prefs", MODE_PRIVATE);
        TOKEN = sp.getString("access_token", null);
        resultService = ApiServices.create(ResultService.class, new SessionInterceptor.TokenProvider() {
            @Override
            public String getToken() {
                return TOKEN;
            }
        });

        // Lấy careProfileId & careProfileName nếu mở từ RecordsActivity
        Intent i = getIntent();
        if (i != null) {
            careProfileIdFilter = i.getStringExtra("careProfileId");
            careProfileName = i.getStringExtra("careProfileName");
        }

        initViews();
        setupRecyclerView();
        setupFilters();
        loadResults();
    }

    private void initViews() {
        btnBack = findViewById(R.id.btnBack);
        spinnerYear = findViewById(R.id.spinnerYear);
        spinnerMonth = findViewById(R.id.spinnerMonth);
        btnClear = findViewById(R.id.btnClear);
        rvResults = findViewById(R.id.rvResults);

        TextView tvTitle = findViewById(R.id.tvTitle);

        if (careProfileName != null) {
            tvTitle.setText("Kết quả khám - " + careProfileName);
        }

        if (btnBack != null) {
            btnBack.setOnClickListener(v -> onBackPressed());
        }
    }

    private void setupRecyclerView() {
        rvResults.setLayoutManager(new LinearLayoutManager(this));
        adapter = new ResultAdapter(filteredResults, item -> {
            Intent intent = new Intent(ChooseResultActivity.this, DetailResultActivity.class);

            intent.putExtra("service", item.getService());
            intent.putExtra("scheduledAt", item.getScheduledAt());
            intent.putExtra("status", item.getStatus());
            intent.putExtra("paymentStatus", item.getPaymentStatus());
            intent.putExtra("examResult", item.getExamResult());
            intent.putExtra("recommend", item.getRecommendation());

            if (item.getPatient() != null) {
                intent.putExtra("patientName", item.getPatient().getFullName());
            }
            if (item.getCareProfile() != null) {
                intent.putExtra("careProfileName", item.getCareProfile().getFullName());
                intent.putExtra("relation", item.getCareProfile().getRelation());
            }
            if (item.getDoctor() != null) {
                intent.putExtra("doctorName", item.getDoctor().getFullName());
            }

            startActivity(intent);
        });
        rvResults.setAdapter(adapter);
    }

    private void setupFilters() {
        // Danh sách năm
        String[] years = {"Tất cả", "2023", "2024", "2025", "2026"};
        spinnerYear.setSimpleItems(years);
        spinnerYear.setText("Tất cả", false);

        // Danh sách tháng
        String[] months = {"Tất cả", "1", "2", "3", "4", "5", "6",
                "7", "8", "9", "10", "11", "12"};
        spinnerMonth.setSimpleItems(months);
        spinnerMonth.setText("Tất cả", false);

        spinnerYear.setOnItemClickListener((parent, view, position, id) -> applyFilter());
        spinnerMonth.setOnItemClickListener((parent, view, position, id) -> applyFilter());

        // Nút clear: reset lại filter năm/tháng, vẫn giữ filter careProfile (nếu có)
        btnClear.setOnClickListener(v -> {
            spinnerYear.setText("Tất cả", false);
            spinnerMonth.setText("Tất cả", false);
            applyFilter();
        });
    }

    private void loadResults() {
        if (TOKEN == null) {
            Toast.makeText(this, "Không tìm thấy token, vui lòng đăng nhập lại", Toast.LENGTH_SHORT).show();
            return;
        }

        resultService.getResults().enqueue(new Callback<ResultResponse>() {
            @Override
            public void onResponse(Call<ResultResponse> call, Response<ResultResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    allResults.clear();
                    if (response.body().getData() != null) {
                        allResults.addAll(response.body().getData());
                    }
                    applyFilter();
                } else {
                    Toast.makeText(ChooseResultActivity.this,
                            "Không tải được kết quả khám", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResultResponse> call, Throwable t) {
                Toast.makeText(ChooseResultActivity.this,
                        "Lỗi kết nối server", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void applyFilter1() {
        filteredResults.clear();
        boolean filterByCareProfile = careProfileIdFilter != null && !careProfileIdFilter.trim().isEmpty();

        for (ResultData item : allResults) {
            // 1. Nếu đang xem theo hồ sơ (careProfileIdFilter != null)
            if (filterByCareProfile) {
                if (item.getCareProfile() == null ||
                        item.getCareProfile().getId() == null ||
                        !careProfileIdFilter.equals(item.getCareProfile().getId())) {
                    continue; // bỏ item không thuộc hồ sơ này
                }
            }
            // 2. KHÔNG LỌC NĂM/THÁNG NỮA → ADD THẲNG
            filteredResults.add(item);
        }

        adapter.updateData(filteredResults);
    }


    private boolean matchDateFilter(String isoDate, Integer year, Integer month) {
        if (isoDate == null) return false;
        try {
            SimpleDateFormat input = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
            input.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date date = input.parse(isoDate);

            Calendar cal = Calendar.getInstance();
            cal.setTime(date);

            int y = cal.get(Calendar.YEAR);
            int m = cal.get(Calendar.MONTH) + 1; // 0-based

            if (year != null && y != year) return false;
            if (month != null && m != month) return false;

            return true;
        } catch (ParseException e) {
            return true; // parse lỗi thì cho qua để tránh mất data
        }
    }
    private void applyFilter() {
        // 1. Lấy giá trị năm / tháng từ spinner
        String yearText = spinnerYear.getText() != null ? spinnerYear.getText().toString() : "Tất cả";
        String monthText = spinnerMonth.getText() != null ? spinnerMonth.getText().toString() : "Tất cả";

        Integer year = null;
        Integer month = null;

        if (!"Tất cả".equals(yearText)) {
            try {
                year = Integer.parseInt(yearText);
            } catch (NumberFormatException ignored) {}
        }
        if (!"Tất cả".equals(monthText)) {
            try {
                month = Integer.parseInt(monthText);
            } catch (NumberFormatException ignored) {}
        }

        // 2. Lọc
        filteredResults.clear();
        boolean filterByCareProfile = careProfileIdFilter != null && !careProfileIdFilter.trim().isEmpty();

        for (ResultData item : allResults) {

            // 2.1 Lọc theo hồ sơ khám (nếu có)
            if (filterByCareProfile) {
                if (item.getCareProfile() == null ||
                        item.getCareProfile().getId() == null ||
                        !careProfileIdFilter.equals(item.getCareProfile().getId())) {
                    continue;
                }
            }

            // 2.2 Lọc theo năm / tháng dựa trên scheduledAt
            if (matchDateFilter(item.getScheduledAt(), year, month)) {
                filteredResults.add(item);
            }
        }

        adapter.updateData(filteredResults);
    }

}
