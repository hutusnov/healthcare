package com.uithealthcare.util;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import java.io.IOException;
import java.security.GeneralSecurityException;

/**
 * SessionManager - Quản lý phiên đăng nhập an toàn
 * 
 * SECURITY: Sử dụng EncryptedSharedPreferences để mã hóa JWT token.
 * Token được mã hóa bằng AES256-GCM, khóa được quản lý bởi Android Keystore.
 */
public class SessionManager {
    private static final String TAG = "SessionManager";
    private static final String PREF = "secure_session_pref";
    private static final String KEY_TOKEN = "auth_token"; // "Bearer <jwt>"

    private final SharedPreferences sp;

    public SessionManager(Context ctx) {
        SharedPreferences preferences;
        try {
            // SECURITY: Create MasterKey for encryption using Android Keystore
            MasterKey masterKey = new MasterKey.Builder(ctx)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();

            // SECURITY: Use EncryptedSharedPreferences for secure token storage
            preferences = EncryptedSharedPreferences.create(
                    ctx,
                    PREF,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM);
            Log.d(TAG, "Using EncryptedSharedPreferences for secure token storage");
        } catch (GeneralSecurityException | IOException e) {
            // Fallback to regular SharedPreferences if encryption fails
            // This should rarely happen on API 24+ devices
            Log.e(TAG, "Failed to create EncryptedSharedPreferences, falling back to regular SharedPreferences", e);
            preferences = ctx.getSharedPreferences(PREF + "_fallback", Context.MODE_PRIVATE);
        }
        sp = preferences;
    }

    public void saveBearer(String jwt) {
        sp.edit().putString(KEY_TOKEN, jwt == null ? null : "Bearer " + jwt).apply();
    }

    public String getBearer() {
        return sp.getString(KEY_TOKEN, null);
    }

    public boolean isLoggedIn() {
        return getBearer() != null;
    }

    public void clear() {
        sp.edit().clear().apply();
    }

    // ✅ Không phụ thuộc vào feature: truyền class màn Login từ nơi gọi
    public void logout(Context context, Class<?> loginActivityClass) {
        clear();
        Intent i = new Intent(context, loginActivityClass);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        context.startActivity(i);
    }
}
