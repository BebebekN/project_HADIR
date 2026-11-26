package com.psas.hadir.data.api

import android.content.Context
import com.psas.hadir.utils.SessionManager
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {

    @Volatile
    private var cachedBaseUrl: String? = null

    @Volatile
    private var apiService: ApiService? = null

    fun getService(context: Context): ApiService {
        val sessionManager = SessionManager(context.applicationContext)
        val currentBaseUrl = sessionManager.getBaseUrl()

        if (apiService == null || cachedBaseUrl != currentBaseUrl) {
            synchronized(this) {
                if (apiService == null || cachedBaseUrl != currentBaseUrl) {
                    val client = OkHttpClient.Builder()
                        .addInterceptor(AuthInterceptor(sessionManager))
                        .connectTimeout(4, TimeUnit.SECONDS)
                        .readTimeout(15, TimeUnit.SECONDS)
                        .writeTimeout(15, TimeUnit.SECONDS)
                        .build()

                    val retrofit = Retrofit.Builder()
                        .baseUrl(currentBaseUrl)
                        .client(client)
                        .addConverterFactory(GsonConverterFactory.create())
                        .build()

                    apiService = retrofit.create(ApiService::class.java)
                    cachedBaseUrl = currentBaseUrl
                }
            }
        }
        return apiService!!
    }

    fun resetClient() {
        synchronized(this) {
            apiService = null
            cachedBaseUrl = null
        }
    }
}
