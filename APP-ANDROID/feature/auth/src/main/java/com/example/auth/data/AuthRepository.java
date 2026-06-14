package com.example.auth.data;

import static com.uithealthcare.network.ApiConfig.BASE_URL;

import android.content.Context;

import com.uithealthcare.network.BuildConfig;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class AuthRepository {

    public interface LoginCallback {
        void onSuccess(AuthApi.LoginResp.Data data);
        void onError(String errorMessage);
    }

    private final AuthApi api;

    public AuthRepository(Context ctx) {
        HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
        logging.setLevel(HttpLoggingInterceptor.Level.BODY);

        OkHttpClient client = new OkHttpClient.Builder()
                .addInterceptor(chain -> {
                    okhttp3.Request request = chain.request();
                    if (BuildConfig.X_SECRET_VERIFY_HEADER != null && !BuildConfig.X_SECRET_VERIFY_HEADER.isEmpty()) {
                        request = request.newBuilder()
                                .addHeader("X-Secret-Verify-Header", BuildConfig.X_SECRET_VERIFY_HEADER)
                                .build();
                    }
                    return chain.proceed(request);
                })
                .addInterceptor(logging)
                .build();

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(BASE_URL) // base URL của bạn
                .addConverterFactory(GsonConverterFactory.create())
                .client(client)
                .build();

        api = retrofit.create(AuthApi.class);
    }

    public void login(String email, String password, LoginCallback cb) {
        AuthApi.LoginReq req = new AuthApi.LoginReq(email, password);
        api.login(req).enqueue(new Callback<AuthApi.LoginResp>() {
            @Override
            public void onResponse(Call<AuthApi.LoginResp> call, Response<AuthApi.LoginResp> response) {
                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    cb.onSuccess(response.body().data);

                } else {
                    String msg = "Login failed";
                    if (response.body() != null && response.body().message != null) {
                        msg = response.body().message;
                    }
                    cb.onError(msg);
                }
            }

            @Override
            public void onFailure(Call<AuthApi.LoginResp> call, Throwable t) {
                cb.onError(t.getMessage());
            }
        });
    }
    public interface RegisterCallback {
        void onSuccess(String message);
        void onError(String message);
    }

    public void register(String fullName, String email, String password, RegisterCallback cb) {
        AuthApi.RegisterReq req = new AuthApi.RegisterReq(email, password, fullName, "PATIENT");
        api.register(req).enqueue(new Callback<AuthApi.RegisterResp>() {
            @Override
            public void onResponse(Call<AuthApi.RegisterResp> call, Response<AuthApi.RegisterResp> res) {
                if (res.isSuccessful() && res.body() != null && res.body().success) {
                    cb.onSuccess(res.body().message != null ? res.body().message : "Registered");
                } else {
                    String msg = (res.body()!=null && res.body().message!=null) ? res.body().message : "Register failed";
                    cb.onError(msg);
                }
            }
            @Override public void onFailure(Call<AuthApi.RegisterResp> call, Throwable t) { cb.onError(t.getMessage()); }
        });
    }

    public interface ForgotPasswordCallback {
        void onSuccess(String message);
        void onError(String message);
    }

    public void forgotPassword(String email, ForgotPasswordCallback cb) {
        AuthApi.ForgotPasswordReq req = new AuthApi.ForgotPasswordReq(email);

        api.forgotPassword(req).enqueue(new Callback<AuthApi.ForgotPasswordResp>() {
            @Override
            public void onResponse(Call<AuthApi.ForgotPasswordResp> call,
                                   Response<AuthApi.ForgotPasswordResp> res) {
                if (res.isSuccessful() && res.body() != null && res.body().success) {

                    String msg = (res.body().message != null) ? res.body().message : "If the email exists, a reset code has been sent";
                    cb.onSuccess(msg);

                } else {
                    String msg = "Gửi mã thất bại";
                    if (res.body() != null && res.body().message != null) {
                        msg = res.body().message;
                    }
                    cb.onError(msg);
                }
            }

            @Override
            public void onFailure(Call<AuthApi.ForgotPasswordResp> call, Throwable t) {
                cb.onError(t.getMessage());
            }
        });
    }
    public interface ResetPasswordCallback {
        void onSuccess(String message);
        void onError(String message);
    }
    public void resetPassword(String email, String code, String newPassword, ResetPasswordCallback cb) {
        AuthApi.ResetPasswordReq req =
                new AuthApi.ResetPasswordReq(email, code, newPassword);

        api.resetPassword(req).enqueue(new Callback<AuthApi.ResetPasswordResp>() {
            @Override
            public void onResponse(Call<AuthApi.ResetPasswordResp> call,
                                   Response<AuthApi.ResetPasswordResp> res) {
                if (res.isSuccessful() && res.body() != null && res.body().success) {
                    String msg = (res.body().message != null)
                            ? res.body().message
                            : "Đổi mật khẩu thành công";
                    cb.onSuccess(msg);
                } else {
                    String msg = "Đổi mật khẩu thất bại";
                    if (res.body() != null && res.body().message != null) {
                        msg = res.body().message;
                    }
                    cb.onError(msg);
                }
            }

            @Override
            public void onFailure(Call<AuthApi.ResetPasswordResp> call, Throwable t) {
                cb.onError(t.getMessage());
            }
        });
    }


}

