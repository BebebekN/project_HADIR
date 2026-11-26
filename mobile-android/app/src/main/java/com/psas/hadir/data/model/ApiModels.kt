package com.psas.hadir.data.model

import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    val success: Boolean,
    val message: String?,
    val data: T?
)

data class LoginRequest(
    @SerializedName("nis_nip") val nisNip: String,
    val password: String
)

data class LoginData(
    val token: String,
    @SerializedName("token_type") val tokenType: String,
    val user: UserDto
)

data class UserDto(
    val id: Long,
    @SerializedName("nis_nip") val nisNip: String,
    @SerializedName("nama_lengkap") val namaLengkap: String,
    val kelas: String?,
    val role: String,
    @SerializedName("avatar_path") val avatarPath: String? = null,
    @SerializedName("avatar_url") val avatarUrl: String? = null,
    @SerializedName("child_nis") val childNis: String? = null,
    @SerializedName("child_name") val childName: String? = null,
    @SerializedName("poin_kedisiplinan") val poinKedisiplinan: Int = 100,
    val bintang: Double = 5.0,
    val predikat: String? = null
)

data class DashboardData(
    val user: UserDto,
    @SerializedName("presensi_hari_ini") val presensiHariIni: PresensiHariIniDto,
    @SerializedName("statistik_kehadiran") val statistikKehadiran: StatistikDto?,
    @SerializedName("jadwal_hari_ini") val jadwalHariIni: JadwalHariIniDto,
    @SerializedName("notifikasi_presensi") val notifikasiPresensi: NotifikasiPresensiDto? = null
)

data class NotifikasiPresensiDto(
    val tampilkan: Boolean = false,
    @SerializedName("sudah_presensi") val sudahPresensi: Boolean = false,
    @SerializedName("batas_waktu") val batasWaktu: String? = null,
    @SerializedName("warning_minutes_before") val warningMinutesBefore: Int = 10,
    @SerializedName("sisa_menit") val sisaMenit: Int = 0,
    val urgensi: String? = null,
    val badge: String? = null,
    val judul: String? = null,
    val pesan: String? = null
)

data class PresensiHariIniDto(
    @SerializedName("sudah_presensi") val sudahPresensi: Boolean,
    val tanggal: String?,
    @SerializedName("jam_datang") val jamDatang: String?,
    @SerializedName("jam_pulang") val jamPulang: String?,
    val status: String?,
    @SerializedName("poin_perubahan") val poinPerubahan: Int = 0,
    val anak: ChildSummaryDto? = null,
    @SerializedName("riwayat_terbaru") val riwayatTerbaru: List<PresensiHistoryItem>? = null,
    @SerializedName("school_geofence") val schoolGeofence: SchoolGeofenceDto? = null
)

data class ChildSummaryDto(
    @SerializedName("nis_nip") val nisNip: String?,
    @SerializedName("nama_lengkap") val namaLengkap: String?,
    val kelas: String?
)

data class PresensiHistoryItem(
    val tanggal: String?,
    @SerializedName("tanggal_label") val tanggalLabel: String?,
    @SerializedName("jam_datang") val jamDatang: String?,
    @SerializedName("jam_pulang") val jamPulang: String?,
    val status: String?,
    @SerializedName("poin_perubahan") val poinPerubahan: Int = 0
)

data class SchoolGeofenceDto(
    val name: String,
    val address: String?,
    val latitude: Double,
    val longitude: Double,
    @SerializedName("radius_meters") val radiusMeters: Double
)

data class StatistikDto(
    @SerializedName("total_kehadiran") val totalKehadiran: Int,
    @SerializedName("tepat_waktu") val tepatWaktu: Int,
    val terlambat: Int,
    @SerializedName("persentase_kedisiplinan") val persentaseKedisiplinan: String?
)

data class JadwalHariIniDto(
    val hari: String,
    @SerializedName("is_weekend") val isWeekend: Boolean,
    @SerializedName("pesan_libur") val pesanLibur: String?,
    val items: List<JadwalItem> = emptyList()
)

data class JadwalItem(
    val id: Long,
    val kelas: String?,
    val hari: String?,
    @SerializedName("nama_kegiatan") val namaKegiatan: String,
    @SerializedName("nama_guru") val namaGuru: String,
    @SerializedName("jam_mulai") val jamMulai: String,
    @SerializedName("jam_selesai") val jamSelesai: String,
    val durasi: String?,
    @SerializedName("is_hari_ini") val isHariIni: Boolean = false,
    @SerializedName("status_waktu") val statusWaktu: String? = null,
    @SerializedName("centang_hijau") val centangHijau: Boolean = false
)

data class JadwalResponseData(
    val kelas: String,
    @SerializedName("hari_ini") val hariIni: String,
    @SerializedName("jam_sekarang") val jamSekarang: String,
    @SerializedName("is_weekend") val isWeekend: Boolean,
    @SerializedName("pesan_libur") val pesanLibur: String?,
    @SerializedName("carousel_hari_ini") val carouselHariIni: List<JadwalItem> = emptyList(),
    @SerializedName("jadwal_mingguan") val jadwalMingguan: Map<String, List<JadwalItem>> = emptyMap()
)

data class ScanRequest(
    @SerializedName("qr_token") val qrToken: String,
    val latitude: Double,
    val longitude: Double
)

data class ScanResultData(
    @SerializedName("tipe_scan") val tipeScan: String?,
    val tanggal: String?,
    @SerializedName("jam_datang") val jamDatang: String?,
    @SerializedName("jam_pulang") val jamPulang: String?,
    val status: String?,
    @SerializedName("poin_perubahan") val poinPerubahan: Int = 0,
    @SerializedName("sisa_poin") val sisaPoin: Int = 100,
    val bintang: Double = 5.0,
    @SerializedName("jarak_meter") val jarakMeter: Int? = null,
    @SerializedName("lokasi_sekolah") val lokasiSekolah: String? = null,
    val pesan: String?
)

data class MonitoringData(
    val kelas: String,
    val tanggal: String,
    val ringkasan: MonitoringSummary,
    val siswa: List<StudentMonitoringItem> = emptyList()
)

data class MonitoringSummary(
    @SerializedName("total_siswa") val totalSiswa: Int,
    @SerializedName("hadir_hari_ini") val hadirHariIni: Int,
    @SerializedName("tepat_waktu") val tepatWaktu: Int,
    val terlambat: Int,
    @SerializedName("belum_hadir") val belumHadir: Int,
    @SerializedName("rata_rata_bintang") val rataRataBintang: Double
)

data class StudentMonitoringItem(
    @SerializedName("user_id") val userId: Long,
    val nis: String,
    @SerializedName("nama_lengkap") val namaLengkap: String,
    val kelas: String?,
    @SerializedName("status_hari_ini") val statusHariIni: String,
    @SerializedName("jam_datang") val jamDatang: String?,
    @SerializedName("jam_pulang") val jamPulang: String?,
    @SerializedName("poin_kedisiplinan") val poinKedisiplinan: Int,
    val bintang: Double,
    val predikat: String
)
