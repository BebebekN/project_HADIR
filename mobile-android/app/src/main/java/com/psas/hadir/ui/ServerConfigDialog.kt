package com.psas.hadir.ui

import android.content.Context
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import com.google.android.material.button.MaterialButton
import com.psas.hadir.R
import com.psas.hadir.data.api.RetrofitClient
import com.psas.hadir.utils.SessionManager

/**
 * Shared dialog to configure Laravel REST API base URL for Physical Phone (Wi-Fi / USB) or Emulator.
 */
object ServerConfigDialog {

    fun show(
        context: Context,
        sessionManager: SessionManager,
        onUpdated: (String) -> Unit
    ) {
        val dp = context.resources.displayMetrics.density
        val pad = (16 * dp).toInt()

        val container = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(pad, (10 * dp).toInt(), pad, (4 * dp).toInt())
        }

        val helper = TextView(context).apply {
            text = "Pilih alamat sesuai koneksi perangkat Anda ke PC/Laptop:"
            textSize = 12f
            setTextColor(context.getColor(R.color.text_muted))
            setPadding(0, 0, 0, (10 * dp).toInt())
        }
        container.addView(helper)

        val input = EditText(context).apply {
            setText(sessionManager.getBaseUrl())
            hint = SessionManager.DEFAULT_CLOUD_BASE_URL
            setPadding((14 * dp).toInt(), (10 * dp).toInt(), (14 * dp).toInt(), (10 * dp).toInt())
            setBackgroundResource(R.drawable.bg_input_pill)
            textSize = 13f
        }

        val presets = listOf(
            "Cloud Online Vercel (Semua HP)" to SessionManager.DEFAULT_CLOUD_BASE_URL,
            "Wi-Fi PC Lokal (172.23.166.32)" to SessionManager.DEFAULT_LAN_BASE_URL,
            "Kabel USB (ADB Reverse 127.0.0.1)" to SessionManager.DEFAULT_USB_BASE_URL,
            "Emulator Android Studio (10.0.2.2)" to SessionManager.DEFAULT_EMULATOR_BASE_URL
        )

        presets.forEach { (label, url) ->
            val btn = MaterialButton(context, null, com.google.android.material.R.attr.materialButtonOutlinedStyle).apply {
                text = label
                isAllCaps = false
                textSize = 12f
                setOnClickListener {
                    input.setText(url)
                    input.setSelection(url.length)
                }
            }
            container.addView(btn)
        }

        container.addView(input)

        AlertDialog.Builder(context)
            .setTitle("Konfigurasi Server API")
            .setView(container)
            .setPositiveButton("Simpan") { _, _ ->
                val url = input.text.toString().trim()
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    sessionManager.saveBaseUrl(url)
                    RetrofitClient.resetClient()
                    onUpdated(sessionManager.getBaseUrl())
                    Toast.makeText(context, "Endpoint API diperbarui", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(context, "URL harus diawali http:// atau https://", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Batal", null)
            .show()
    }
}
