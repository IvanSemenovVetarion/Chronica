plugins {
    id("com.android.application")
}

android {
    namespace = "com.vetarion.chronica"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.vetarion.chronica"
        minSdk = 24
        targetSdk = 34
        versionCode = 204
        versionName = "2.0.1"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    sourceSets {
        getByName("main").assets.srcDirs("../../ui", "src/main/assets")
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}
