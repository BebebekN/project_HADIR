package com.psas.hadir.data.api

import com.psas.hadir.utils.SessionManager
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val sessionManager: SessionManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val builder = original.newBuilder()
            .header("Accept", "application/json")

        val token = sessionManager.getToken()
        if (!token.isNullOrBlank()) {
            builder.header("Authorization", "Bearer $token")
        }

        return chain.proceed(builder.build())
    }
}
