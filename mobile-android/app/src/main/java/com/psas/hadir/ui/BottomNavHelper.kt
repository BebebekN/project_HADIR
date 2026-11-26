package com.psas.hadir.ui

import android.app.Activity
import android.content.Intent
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.psas.hadir.R
import com.psas.hadir.utils.SessionManager

enum class BottomNavTab {
    BERANDA, JADWAL, RAPOT, PROFIL
}

/**
 * Shared setup helper for Figma floating bottom navigation bar.
 * Hides center QR scanner button automatically when logged in as parent (orang_tua).
 */
object BottomNavHelper {

    fun bind(
        activity: Activity,
        rootView: View,
        activeTab: BottomNavTab,
        onScanClick: (() -> Unit)? = null
    ) {
        val activeColor = ContextCompat.getColor(activity, R.color.brand_blue)
        val mutedColor = ContextCompat.getColor(activity, R.color.text_muted)
        val isOrangTua = SessionManager(activity).getUser()?.role == "orang_tua"

        val tabs = listOf(
            Triple(BottomNavTab.BERANDA, R.id.ivNavBeranda, R.id.tvNavBeranda),
            Triple(BottomNavTab.JADWAL, R.id.ivNavJadwal, R.id.tvNavJadwal),
            Triple(BottomNavTab.RAPOT, R.id.ivNavRapot, R.id.tvNavRapot),
            Triple(BottomNavTab.PROFIL, R.id.ivNavProfil, R.id.tvNavProfil),
        )

        tabs.forEach { (tab, ivId, tvId) ->
            val color = if (tab == activeTab) activeColor else mutedColor
            rootView.findViewById<ImageView>(ivId)?.setColorFilter(color)
            rootView.findViewById<TextView>(tvId)?.setTextColor(color)
        }

        val scanButton = rootView.findViewById<View>(R.id.navScanQr)
        val centerSpacer = rootView.findViewById<View>(R.id.navCenterSpacer)
        if (isOrangTua) {
            scanButton?.visibility = View.GONE
            centerSpacer?.visibility = View.GONE
            rootView.findViewById<TextView>(R.id.tvNavBeranda)?.text = "Pantau"
        } else {
            scanButton?.visibility = View.VISIBLE
            centerSpacer?.visibility = View.VISIBLE
            rootView.findViewById<TextView>(R.id.tvNavBeranda)?.text = "Beranda"
        }

        rootView.findViewById<View>(R.id.navBeranda)?.setOnClickListener {
            if (activeTab != BottomNavTab.BERANDA) {
                activity.startActivity(
                    Intent(activity, MainActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                )
                if (activity !is MainActivity) activity.finish()
            }
        }

        rootView.findViewById<View>(R.id.navJadwal)?.setOnClickListener {
            if (activeTab != BottomNavTab.JADWAL) {
                activity.startActivity(Intent(activity, JadwalActivity::class.java))
                if (activity !is MainActivity) activity.finish()
            }
        }

        scanButton?.setOnClickListener {
            if (onScanClick != null) {
                onScanClick.invoke()
            } else {
                activity.startActivity(Intent(activity, ScannerActivity::class.java))
            }
        }

        rootView.findViewById<View>(R.id.navRapot)?.setOnClickListener {
            if (activeTab != BottomNavTab.RAPOT) {
                activity.startActivity(Intent(activity, RapotActivity::class.java))
                if (activity !is MainActivity) activity.finish()
            }
        }

        rootView.findViewById<View>(R.id.navProfil)?.setOnClickListener {
            if (activeTab != BottomNavTab.PROFIL) {
                activity.startActivity(Intent(activity, ProfilActivity::class.java))
                if (activity !is MainActivity) activity.finish()
            }
        }
    }
}
