package com.uithealthcare.network;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.concurrent.TimeUnit;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public final class RetrofitProvider {
    private RetrofitProvider(){}

    private static Retrofit backendRetrofit;
    private static Retrofit ocrRetrofit;

    public static Retrofit get(SessionInterceptor.TokenProvider tokenProvider){
        if (backendRetrofit == null){
            HttpLoggingInterceptor log = new HttpLoggingInterceptor();
            log.setLevel(HttpLoggingInterceptor.Level.BODY);

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
                    .addInterceptor(new SessionInterceptor(tokenProvider))
                    .addInterceptor(log)
                    .connectTimeout(30, TimeUnit.SECONDS)  // thời gian chờ connect
                    .writeTimeout(60, TimeUnit.SECONDS)    // upload ảnh
                    .readTimeout(600, TimeUnit.SECONDS)
                    .build();

            Gson gson = new GsonBuilder().setLenient().create();

            backendRetrofit = new Retrofit.Builder()
                    .baseUrl(ApiConfig.BASE_URL)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create(gson))
                    .build();
        }
        return backendRetrofit;
    }

    public static Retrofit getOCR(SessionInterceptor.TokenProvider tokenProvider){
        if (ocrRetrofit == null){
            HttpLoggingInterceptor log = new HttpLoggingInterceptor();
            log.setLevel(HttpLoggingInterceptor.Level.BODY);

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
                    .addInterceptor(new SessionInterceptor(tokenProvider))
                    .addInterceptor(log)
                    .connectTimeout(30, TimeUnit.SECONDS)  // thời gian chờ connect
                    .writeTimeout(60, TimeUnit.SECONDS)    // upload ảnh
                    .readTimeout(600, TimeUnit.SECONDS)
                    .build();

            Gson gson = new GsonBuilder().setLenient().create();

            ocrRetrofit = new Retrofit.Builder()
                    .baseUrl(ApiConfig.BASE_URL)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create(gson))
                    .build();
        }
        return ocrRetrofit;
    }
    public static synchronized void reset() {
        backendRetrofit = null;
        ocrRetrofit = null;
    }
}
