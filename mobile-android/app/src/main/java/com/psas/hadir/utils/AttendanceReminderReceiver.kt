package com.psas.hadir.utils

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Fires daily at 06:50 WIB (10 minutes before check-in cutoff) to remind active students.
 */
class AttendanceReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (ScheduleTimeUtils.isWeekendNow()) return

        val session = SessionManager(context)
        val user = session.getUser()
        if (session.isLoggedIn() && user?.role == "siswa") {
            NotificationHelper.showTenMinuteWarningSample(context)
        }
    }
}
