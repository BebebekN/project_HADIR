package com.psas.hadir.utils

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import com.google.gson.Gson
import com.psas.hadir.data.model.UserDto

class SessionManager(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()

    fun saveSession(token: String, user: UserDto) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_USER, gson.toJson(user))
            .apply()
    }

    fun updateUser(user: UserDto) {
        prefs.edit()
            .putString(KEY_USER, gson.toJson(user))
            .apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun getUser(): UserDto? {
        val json = prefs.getString(KEY_USER, null) ?: return null
        return try {
            gson.fromJson(json, UserDto::class.java)
        } catch (_: Exception) {
            null
        }
    }

    fun isLoggedIn(): Boolean = !getToken().isNullOrBlank() && getUser() != null

    fun resolveAvatarUrl(user: UserDto? = getUser()): String? {
        if (user == null) return null
        val directUrl = user.avatarUrl
        if (!directUrl.isNullOrBlank() &&
            (directUrl.startsWith("http://") || directUrl.startsWith("https://"))
        ) {
            return directUrl
        }
        val path = user.avatarPath
        if (!path.isNullOrBlank()) {
            if (path.startsWith("http://") || path.startsWith("https://")) {
                return path
            }
            val origin = getBaseUrl().trimEnd('/').removeSuffix("/api/v1")
            return "$origin/${path.trimStart('/')}"
        }
        return directUrl
    }

    fun saveBaseUrl(url: String) {
        val normalized = if (url.endsWith("/")) url else "$url/"
        prefs.edit()
            .putString(KEY_BASE_URL, normalized)
            .putBoolean(KEY_IS_CUSTOM_URL, true)
            .apply()
    }

    fun getBaseUrl(): String {
        val isCustom = prefs.getBoolean(KEY_IS_CUSTOM_URL, false)
        val saved = prefs.getString(KEY_BASE_URL, null)
        if (isCustom && !saved.isNullOrBlank()) {
            return saved
        }
        return if (isEmulator()) DEFAULT_EMULATOR_BASE_URL else DEFAULT_CLOUD_BASE_URL
    }

    fun clearSession() {
        val savedUrl = prefs.getString(KEY_BASE_URL, null)
        val isCustom = prefs.getBoolean(KEY_IS_CUSTOM_URL, false)
        prefs.edit()
            .clear()
            .apply {
                if (isCustom && !savedUrl.isNullOrBlank()) {
                    putString(KEY_BASE_URL, savedUrl)
                    putBoolean(KEY_IS_CUSTOM_URL, true)
                }
            }
            .apply()
    }

    companion object {
        private const val PREFS_NAME = "psas_hadir_prefs"
        private const val KEY_TOKEN = "sanctum_token"
        private const val KEY_USER = "current_user_json"
        private const val KEY_BASE_URL = "api_base_url"
        private const val KEY_IS_CUSTOM_URL = "api_base_url_custom"

        const val DEFAULT_CLOUD_BASE_URL = "https://project-hadir.vercel.app/api/v1/"
        const val DEFAULT_EMULATOR_BASE_URL = "http://10.0.2.2:8000/api/v1/"
        const val DEFAULT_LAN_BASE_URL = "http://172.23.166.32:8000/api/v1/"
        const val DEFAULT_USB_BASE_URL = "http://127.0.0.1:8000/api/v1/"

        fun isEmulator(): Boolean {
            return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")
                || "google_sdk" == Build.PRODUCT
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu"))
        }
    }
}
