package com.psas.hadir.utils

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.psas.hadir.R
import com.psas.hadir.ui.MainActivity
import com.psas.hadir.ui.ScannerActivity
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object NotificationHelper {

    const val CHANNEL_ID = "hadir_absensi_channel"
    private const val CHANNEL_NAME = "Pengingat Presensi HADIR"
    private const val CHANNEL_DESC = "Notifikasi peringatan batas waktu absen siswa (H-10 menit sebelum 07:00 WIB)."
    private const val NOTIFICATION_ID_REMINDER = 1001
    private const val ALARM_REQUEST_CODE = 1010
    private const val PREF_NOTIF = "psas_hadir_notif_prefs"
    private const val KEY_LAST_AUTO_NOTIF_DATE = "last_auto_notif_date"

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = CHANNEL_DESC
                enableVibration(true)
                enableLights(true)
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    fun hasNotificationPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    fun showAttendanceReminderNotification(
        context: Context,
        title: String,
        message: String,
        urgent: Boolean = true
    ): Boolean {
        ensureChannel(context)
        if (!hasNotificationPermission(context)) {
            return false
        }

        val session = SessionManager(context)
        val user = session.getUser()
        val targetIntent = if (session.isLoggedIn() && user?.role == "siswa") {
            Intent(context, ScannerActivity::class.java)
        } else {
            Intent(context, MainActivity::class.java)
        }.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            NOTIFICATION_ID_REMINDER,
            targetIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_hadir_logo_mark)
            .setColor(ContextCompat.getColor(context, R.color.brand_blue))
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(if (urgent) NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_DEFAULT)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        return try {
            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID_REMINDER, builder.build())
            true
        } catch (_: SecurityException) {
            false
        }
    }

    fun showTenMinuteWarningSample(context: Context): Boolean {
        return showAttendanceReminderNotification(
            context = context,
            title = "HADIR • Batas Waktu Absen 10 Menit Lagi!",
            message = "Peringatan untuk siswa agar segera absen, karena batas waktu absen tinggal 10 menit lagi (pukul 07:00 WIB). Segera scan QR di SMK Telkom Purwokerto!",
            urgent = true
        )
    }

    fun autoNotifyStudentIfEligible(
        context: Context,
        title: String,
        message: String
    ) {
        val todayKey = todayDateKey()
        val prefs = context.getSharedPreferences(PREF_NOTIF, Context.MODE_PRIVATE)
        if (prefs.getString(KEY_LAST_AUTO_NOTIF_DATE, null) == todayKey) {
            return
        }
        if (showAttendanceReminderNotification(context, title, message, urgent = true)) {
            prefs.edit().putString(KEY_LAST_AUTO_NOTIF_DATE, todayKey).apply()
        }
    }

    /**
     * Schedules a daily 06:50 WIB alarm (10 minutes before 07:00 WIB deadline) on school days.
     */
    fun scheduleDailyTenMinuteWarning(context: Context) {
        ensureChannel(context)
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, AttendanceReminderReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            ALARM_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val jakartaTz = TimeZone.getTimeZone("Asia/Jakarta")
        val target = Calendar.getInstance(jakartaTz).apply {
            set(Calendar.HOUR_OF_DAY, 6)
            set(Calendar.MINUTE, 50)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        alarmManager.setInexactRepeating(
            AlarmManager.RTC_WAKEUP,
            target.timeInMillis,
            AlarmManager.INTERVAL_DAY,
            pendingIntent
        )
    }

    private fun todayDateKey(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("Asia/Jakarta")
        }
        return sdf.format(Date())
    }
}
