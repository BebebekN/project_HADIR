package com.psas.hadir.utils

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

enum class SessionStatus {
    COMPLETED, // Centang hijau real-time (hari & jam sudah terlewati pada Senin-Jumat)
    ONGOING,   // Sedang berlangsung saat ini
    UPCOMING,  // Belum dimulai / abu-abu
    WEEKEND    // Libur Sabtu & Minggu
}

object ScheduleTimeUtils {

    private val jakartaTz = TimeZone.getTimeZone("Asia/Jakarta")

    private val dayOrder = mapOf(
        "Senin" to 1,
        "Selasa" to 2,
        "Rabu" to 3,
        "Kamis" to 4,
        "Jumat" to 5,
        "Sabtu" to 6,
        "Minggu" to 7
    )

    fun getCurrentDayName(): String {
        val cal = Calendar.getInstance(jakartaTz)
        return when (cal.get(Calendar.DAY_OF_WEEK)) {
            Calendar.MONDAY -> "Senin"
            Calendar.TUESDAY -> "Selasa"
            Calendar.WEDNESDAY -> "Rabu"
            Calendar.THURSDAY -> "Kamis"
            Calendar.FRIDAY -> "Jumat"
            Calendar.SATURDAY -> "Sabtu"
            Calendar.SUNDAY -> "Minggu"
            else -> "Senin"
        }
    }

    fun isWeekendNow(): Boolean {
        val cal = Calendar.getInstance(jakartaTz)
        val day = cal.get(Calendar.DAY_OF_WEEK)
        return day == Calendar.SATURDAY || day == Calendar.SUNDAY
    }

    /**
     * Logika centang hijau real-time:
     * - Hanya menyala (COMPLETED) jika hari & jam kegiatan sudah terlewati pada Senin–Jumat
     * - Abu-abu (UPCOMING) jika belum waktunya
     * - Libur (WEEKEND) jika Sabtu–Minggu
     */
    fun evaluateSessionStatus(
        hari: String?,
        jamMulai: String,
        jamSelesai: String
    ): SessionStatus {
        if (isWeekendNow()) {
            return SessionStatus.WEEKEND
        }

        val todayName = getCurrentDayName()
        val todayIndex = dayOrder[todayName] ?: 1
        val itemDayIndex = dayOrder[hari ?: todayName] ?: todayIndex

        if (itemDayIndex < todayIndex) {
            return SessionStatus.COMPLETED
        }
        if (itemDayIndex > todayIndex) {
            return SessionStatus.UPCOMING
        }

        // Same day: compare real-time HH:mm in WIB
        val cal = Calendar.getInstance(jakartaTz)
        val sdf = SimpleDateFormat("HH:mm", Locale.getDefault()).apply {
            timeZone = jakartaTz
        }
        val currentHHmm = sdf.format(cal.time)
        val startHHmm = jamMulai.take(5)
        val endHHmm = jamSelesai.take(5)

        return when {
            currentHHmm >= endHHmm -> SessionStatus.COMPLETED
            currentHHmm >= startHHmm && currentHHmm < endHHmm -> SessionStatus.ONGOING
            else -> SessionStatus.UPCOMING
        }
    }
}
