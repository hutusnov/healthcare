package com.example.appointment.ui;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.appointment.R;
import com.example.appointment.api.CareProfileService;
import com.example.appointment.api.LocationService;
import com.example.appointment.api.OCRService;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.MaterialAutoCompleteTextView;
import com.google.android.material.textfield.TextInputEditText;
import com.uithealthcare.domain.careProfile.CreateCareProfileRequest;
import com.uithealthcare.domain.careProfile.CreateCareProfileResponse;
import com.uithealthcare.domain.location.District;
import com.uithealthcare.domain.location.DistrictResponse;
import com.uithealthcare.domain.location.Province;
import com.uithealthcare.domain.location.ProvinceResponse;
import com.uithealthcare.domain.location.Ward;
import com.uithealthcare.domain.location.WardResponse;
import com.uithealthcare.domain.ocr.CccdData;
import com.uithealthcare.domain.ocr.OcrResponse;
import com.uithealthcare.network.ApiServices;
import com.uithealthcare.network.SessionInterceptor;
import com.uithealthcare.util.ConvertDate;
import com.uithealthcare.util.HandleAutoComplete;
import com.uithealthcare.util.ScanManager;
import com.uithealthcare.util.SessionManager;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CreateProfileActivity extends AppCompatActivity {
    private TextInputEditText etFullName;
    private TextInputEditText etPhone;
    private TextInputEditText etRelation;
    private TextInputEditText etDob;
    private TextInputEditText etAddressDetail;

    private MaterialAutoCompleteTextView autoCountry;
    private MaterialAutoCompleteTextView autoGender;
    private MaterialAutoCompleteTextView autoProvince;
    private MaterialAutoCompleteTextView autoDistrict;
    private MaterialAutoCompleteTextView autoWard;

    private MaterialButton btnCreate;
    private MaterialButton btnBack;
    private MaterialButton btnScan;
    private ProgressBar progressBar;

    private CareProfileService careProfileService;
    private LocationService locationService;
    private OCRService ocrService;
    private List<Province> provinceList;
    private List<District> districtList;
    private List<Ward> wardList;
    private final List<String> genderList = Arrays.asList("Nam", "Nu", "Khac");
    private final List<String> countryList = List.of("Viet Nam");

    private String selectedProvinceCode;
    private String selectedDistrictCode;
    private String selectedWardCode;

    private ActivityResultLauncher<Intent> pickImageLauncher;
    private ActivityResultLauncher<Uri> takePictureLauncher;
    private LoadingDialog loadingDialog;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.create_profile);

        SessionManager sessionManager = new SessionManager(this);
        SessionInterceptor.TokenProvider tokenProvider = sessionManager::getBearer;

        careProfileService = ApiServices.create(CareProfileService.class, tokenProvider);
        locationService = ApiServices.create(LocationService.class, tokenProvider);
        ocrService = ApiServices.createOCR(OCRService.class, tokenProvider);

        pickImageLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                        Uri imageUri = result.getData().getData();
                        if (imageUri != null) {
                            processOCR(imageUri);
                        }
                    }
                }
        );

        takePictureLauncher = registerForActivityResult(
                new ActivityResultContracts.TakePicture(),
                isSuccess -> {
                    if (isSuccess && ScanManager.cameraImageUri != null) {
                        processOCR(ScanManager.cameraImageUri);
                    }
                }
        );

        initView();
        loadProvinces(locationService);
        initEvent();
    }

    private void initView() {
        etFullName = findViewById(R.id.edtFullName);
        etPhone = findViewById(R.id.edtPhone);
        etRelation = findViewById(R.id.edtRelation);
        autoCountry = findViewById(R.id.autoCountry);
        autoGender = findViewById(R.id.autoGender);
        etDob = findViewById(R.id.edtDob);
        autoProvince = findViewById(R.id.autoProvince);
        autoDistrict = findViewById(R.id.autoDistrict);
        autoWard = findViewById(R.id.autoWard);
        etAddressDetail = findViewById(R.id.edtAddress);

        HandleAutoComplete.setupDropDown(autoCountry, countryList);
        HandleAutoComplete.setupDropDown(autoGender, genderList);

        btnCreate = findViewById(R.id.btnCreate);
        btnBack = findViewById(R.id.btnBack);
        btnScan = findViewById(R.id.btnScan);
        loadingDialog = new LoadingDialog(this);
    }

    private void initEvent() {
        btnBack.setOnClickListener(v -> finish());
        btnCreate.setOnClickListener(v -> sendRequest(careProfileService));
        btnScan.setOnClickListener(v ->
                ScanManager.showScanOptionDialog(v, pickImageLauncher, takePictureLauncher)
        );
    }

    private CreateCareProfileRequest createRequest() {
        String fullName = getText(etFullName);
        String phone = getText(etPhone);
        String relation = getText(etRelation);
        String dob = getText(etDob).isEmpty() ? "" : ConvertDate.VNtoDateUS(getText(etDob));
        String addressDetail = getText(etAddressDetail);
        String country = getAutoText(autoCountry);
        String gender = getAutoText(autoGender);

        return new CreateCareProfileRequest(
                fullName,
                relation,
                phone,
                country,
                gender,
                dob,
                selectedProvinceCode,
                selectedDistrictCode,
                selectedWardCode,
                addressDetail
        );
    }

    private String getText(TextInputEditText input) {
        return input.getText() == null ? "" : input.getText().toString().trim();
    }

    private String getAutoText(MaterialAutoCompleteTextView input) {
        return input.getText() == null ? "" : input.getText().toString().trim();
    }

    private void sendRequest(CareProfileService careProfileService) {
        CreateCareProfileRequest request = createRequest();
        careProfileService.createCareProfile(request).enqueue(new Callback<CreateCareProfileResponse>() {
            @Override
            public void onResponse(Call<CreateCareProfileResponse> call, Response<CreateCareProfileResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Toast.makeText(CreateProfileActivity.this, response.body().getMessage(), Toast.LENGTH_LONG).show();
                    finish();
                    return;
                }
                Toast.makeText(CreateProfileActivity.this, "Tao ho so that bai: " + response.code(), Toast.LENGTH_LONG).show();
            }

            @Override
            public void onFailure(Call<CreateCareProfileResponse> call, Throwable throwable) {
                Toast.makeText(CreateProfileActivity.this, throwable.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void loadProvinces(LocationService locationService) {
        locationService.getProvinces().enqueue(new Callback<ProvinceResponse>() {
            @Override
            public void onResponse(Call<ProvinceResponse> call, Response<ProvinceResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    provinceList = response.body().getData();
                    HandleAutoComplete.setupDropDown(autoProvince, provinceList);
                    autoProvince.setOnItemClickListener((parent, view, position, id) -> {
                        autoDistrict.setText("");
                        autoWard.setText("");
                        selectedDistrictCode = null;
                        selectedWardCode = null;

                        Province selected = (Province) parent.getItemAtPosition(position);
                        selectedProvinceCode = selected.getCode();
                        loadDistricts(locationService, selectedProvinceCode);
                    });
                    return;
                }
                Toast.makeText(CreateProfileActivity.this, "Khong lay duoc tinh: " + response.code(), Toast.LENGTH_LONG).show();
            }

            @Override
            public void onFailure(Call<ProvinceResponse> call, Throwable throwable) {
                Toast.makeText(CreateProfileActivity.this, throwable.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void loadDistricts(LocationService locationService, String provinceCode) {
        locationService.getDistricts(provinceCode).enqueue(new Callback<DistrictResponse>() {
            @Override
            public void onResponse(Call<DistrictResponse> call, Response<DistrictResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    districtList = response.body().getData();
                    HandleAutoComplete.setupDropDown(autoDistrict, districtList);
                    autoDistrict.setOnItemClickListener((parent, view, position, id) -> {
                        autoWard.setText("");
                        selectedWardCode = null;

                        District selected = (District) parent.getItemAtPosition(position);
                        selectedDistrictCode = selected.getCode();
                        loadWard(locationService, selectedDistrictCode);
                    });
                    return;
                }
                Toast.makeText(CreateProfileActivity.this, "Khong lay duoc huyen: " + response.code(), Toast.LENGTH_LONG).show();
            }

            @Override
            public void onFailure(Call<DistrictResponse> call, Throwable throwable) {
                Toast.makeText(CreateProfileActivity.this, throwable.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void loadWard(LocationService locationService, String districtCode) {
        locationService.getWards(districtCode).enqueue(new Callback<WardResponse>() {
            @Override
            public void onResponse(Call<WardResponse> call, Response<WardResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    wardList = response.body().getData();
                    HandleAutoComplete.setupDropDown(autoWard, wardList);
                    autoWard.setOnItemClickListener((parent, view, position, id) -> {
                        Ward selected = (Ward) parent.getItemAtPosition(position);
                        selectedWardCode = selected.getCode();
                    });
                    return;
                }
                Toast.makeText(CreateProfileActivity.this, "Khong lay duoc phuong: " + response.code(), Toast.LENGTH_LONG).show();
            }

            @Override
            public void onFailure(Call<WardResponse> call, Throwable throwable) {
                Toast.makeText(CreateProfileActivity.this, throwable.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void processOCR(Uri imageUri) {
        loadingDialog.show();
        try {
            InputStream inputStream = getContentResolver().openInputStream(imageUri);
            if (inputStream == null) {
                throw new IllegalStateException("Cannot open selected image");
            }

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] bytes = new byte[4096];
            int read;
            while ((read = inputStream.read(bytes)) != -1) {
                buffer.write(bytes, 0, read);
            }
            inputStream.close();

            RequestBody requestFile = RequestBody.create(
                    buffer.toByteArray(),
                    MediaType.parse("image/*")
            );
            MultipartBody.Part body = MultipartBody.Part.createFormData("file", "cccd.jpg", requestFile);

            ocrService.uploadCccd(body).enqueue(new Callback<OcrResponse>() {
                @Override
                public void onResponse(Call<OcrResponse> call, Response<OcrResponse> response) {
                    loadingDialog.dismiss();
                    if (!response.isSuccessful() || response.body() == null) {
                        Toast.makeText(CreateProfileActivity.this, "OCR that bai: " + response.code(), Toast.LENGTH_LONG).show();
                        return;
                    }

                    CccdData data = response.body().getData();
                    if (data == null) {
                        Toast.makeText(CreateProfileActivity.this, "OCR khong tra ve du lieu CCCD", Toast.LENGTH_LONG).show();
                        return;
                    }

                    bindCccdData(data);
                    Toast.makeText(CreateProfileActivity.this, "Scan hoan tat", Toast.LENGTH_LONG).show();
                    Log.d("MyOCR", "OCR success: " + data.getFullName());
                }

                @Override
                public void onFailure(Call<OcrResponse> call, Throwable throwable) {
                    loadingDialog.dismiss();
                    Toast.makeText(CreateProfileActivity.this, "Loi OCR: " + throwable.getMessage(), Toast.LENGTH_LONG).show();
                    Log.d("MyOCR", "OCR network error: " + throwable.getMessage());
                }
            });
        } catch (Exception e) {
            loadingDialog.dismiss();
            Toast.makeText(this, "Loi doc anh: " + e.getMessage(), Toast.LENGTH_LONG).show();
            Log.d("MyOCR", "Read image error", e);
        }
    }

    private void bindCccdData(CccdData data) {
        if (!data.getFullName().isEmpty()) {
            etFullName.setText(data.getFullName());
        }
        if (data.getGender() != null && !data.getGender().isEmpty()) {
            autoGender.setText(normalizeGender(data.getGender()), false);
        }
        if (data.getCountry() != null && !data.getCountry().isEmpty()) {
            autoCountry.setText(normalizeCountry(data.getCountry()), false);
        }
        if (!data.getDateOfBirth().isEmpty()) {
            etDob.setText(data.getDateOfBirth());
        }
        if (data.getAddress() != null && !data.getAddress().isEmpty()) {
            etAddressDetail.setText(data.getAddress());
        }
    }

    private String normalizeGender(String gender) {
        if (gender.equalsIgnoreCase("Nu") || gender.equalsIgnoreCase("Nữ")) return "Nu";
        if (gender.equalsIgnoreCase("Nam")) return "Nam";
        return "Khac";
    }

    private String normalizeCountry(String country) {
        return country.toLowerCase().contains("viet") ? "Viet Nam" : country;
    }
}
