package com.psas.hadir.data.api

import com.psas.hadir.data.model.ApiResponse
import com.psas.hadir.data.model.DashboardData
import com.psas.hadir.data.model.JadwalResponseData
import com.psas.hadir.data.model.LoginData
import com.psas.hadir.data.model.LoginRequest
import com.psas.hadir.data.model.MonitoringData
import com.psas.hadir.data.model.PresensiHariIniDto
import com.psas.hadir.data.model.ScanRequest
import com.psas.hadir.data.model.ScanResultData
import com.psas.hadir.data.model.UserDto
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Query

interface ApiService {

    @POST("login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<LoginData>>

    @POST("logout")
    suspend fun logout(): Response<ApiResponse<Any>>

    @GET("user")
    suspend fun getProfile(): Response<ApiResponse<UserDto>>

    @Multipart
    @POST("user/photo")
    suspend fun uploadProfilePhoto(@Part photo: MultipartBody.Part): Response<ApiResponse<UserDto>>

    @DELETE("user/photo")
    suspend fun deleteProfilePhoto(): Response<ApiResponse<UserDto>>

    @GET("dashboard")
    suspend fun getDashboard(): Response<ApiResponse<DashboardData>>

    @GET("jadwal")
    suspend fun getJadwal(@Query("kelas") kelas: String? = null): Response<ApiResponse<JadwalResponseData>>

    @GET("presensi/today")
    suspend fun getTodayPresensi(): Response<ApiResponse<PresensiHariIniDto>>

    @POST("presensi/scan")
    suspend fun scanPresensi(@Body request: ScanRequest): Response<ApiResponse<ScanResultData>>

    @GET("guru/monitoring")
    suspend fun getGuruMonitoring(
        @Query("kelas") kelas: String,
        @Query("tanggal") tanggal: String? = null
    ): Response<ApiResponse<MonitoringData>>
}
