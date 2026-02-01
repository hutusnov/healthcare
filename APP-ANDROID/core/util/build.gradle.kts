// APP-ANDROID/core/util/build.gradle.kts

plugins {
    alias(libs.plugins.android.library)
    // Nếu module util có code Kotlin thì bật thêm dòng dưới:
    // alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.uithealthcare.util"
    compileSdk = 36

    defaultConfig {
        minSdk = 24
    }

    compileOptions {
        // AGP 8.x khuyến nghị dùng JDK 17
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    // Nếu dùng Kotlin, mở comment sau:
    // kotlinOptions {
    //     jvmTarget = "17"
    // }
}

dependencies {
    // Module util là tiện ích thuần, KHÔNG cần UI libs như appcompat/material.
    // Chỉ thêm khi thật sự dùng.
    implementation(libs.appcompat)
    implementation(libs.material)
    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)

    implementation(libs.activity)
    implementation(libs.constraintlayout)
    implementation(libs.core.splashscreen)
    
    // SECURITY: For encrypted token storage
    implementation(libs.security.crypto)

    // Nếu viết Kotlin và cần các tiện ích KTX, có thể thêm (không bắt buộc):
    // implementation(libs.androidx.core.ktx)
}
