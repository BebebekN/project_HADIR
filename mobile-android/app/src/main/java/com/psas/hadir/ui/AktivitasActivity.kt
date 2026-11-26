package com.psas.hadir.ui

import android.os.Bundle
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.psas.hadir.R
import com.psas.hadir.data.api.RetrofitClient
import com.psas.hadir.data.model.PresensiHistoryItem
import com.psas.hadir.databinding.ActivityAktivitasBinding
import com.psas.hadir.utils.SessionManager
import kotlinx.coroutines.launch

class AktivitasActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAktivitasBinding
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAktivitasBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)
        binding.btnBackAktivitas.setOnClickListener { finish() }
        BottomNavHelper.bind(this, binding.root, BottomNavTab.BERANDA)

        bindParentBanner()
        loadTodayActivity()
    }

    override fun onResume() {
        super.onResume()
        loadTodayActivity()
    }

    private fun bindParentBanner() {
        val user = sessionManager.getUser()
        if (user?.role == "orang_tua") {
            binding.cardParentChildInfo.visibility = View.VISIBLE
            binding.tvParentChildName.text =
                "${user.childName ?: "-"} • NIS ${user.childNis ?: "-"} (${user.kelas ?: "XI PPLG 4"})"
        } else {
            binding.cardParentChildInfo.visibility = View.GONE
        }
    }

    private fun loadTodayActivity() {
        lifecycleScope.launch {
            try {
                val res = RetrofitClient.getService(this@AktivitasActivity).getTodayPresensi()
                if (res.isSuccessful && res.body()?.success == true) {
                    val data = res.body()?.data ?: return@launch
                    data.anak?.let { anak ->
                        if (sessionManager.getUser()?.role == "orang_tua") {
                            binding.cardParentChildInfo.visibility = View.VISIBLE
                            binding.tvParentChildName.text =
                                "${anak.namaLengkap ?: "-"} • NIS ${anak.nisNip ?: "-"} (${anak.kelas ?: "XI PPLG 4"})"
                        }
                    }

                    binding.tvAktivitasDatang.text = data.jamDatang ?: "--:--"
                    binding.tvAktivitasPulang.text = data.jamPulang ?: "--:--"

                    val status = data.status ?: "Belum Scan"
                    binding.tvAktivitasStatusDatang.text = status
                    if (status == "Terlambat") {
                        binding.tvAktivitasStatusDatang.setTextColor(
                            ContextCompat.getColor(this@AktivitasActivity, R.color.danger_red)
                        )
                    } else {
                        binding.tvAktivitasStatusDatang.setTextColor(
                            ContextCompat.getColor(this@AktivitasActivity, R.color.badge_green_text)
                        )
                    }

                    binding.tvAktivitasStatusPulang.text =
                        if (data.jamPulang != null) "Sudah Pulang" else "15:30 - 16:00 WIB"

                    binding.tvTimelineScanDesc.text = if (data.sudahPresensi) {
                        "Tercatat di kawasan SMK Telkom Purwokerto pukul ${data.jamDatang} ($status)"
                    } else {
                        "Belum ada scan presensi datang hari ini"
                    }

                    renderHistoryList(data.riwayatTerbaru.orEmpty())
                }
            } catch (_: Exception) {
                // Keep defaults on offline state
            }
        }
    }

    private fun renderHistoryList(items: List<PresensiHistoryItem>) {
        val container = binding.containerRiwayatPresensi
        container.removeAllViews()

        if (items.isEmpty()) {
            binding.tvRiwayatEmpty.visibility = View.VISIBLE
            return
        }

        binding.tvRiwayatEmpty.visibility = View.GONE
        val dp = resources.displayMetrics.density

        items.forEachIndexed { idx, item ->
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = android.view.Gravity.CENTER_VERTICAL
                setBackgroundResource(R.drawable.bg_input_pill)
                setPadding((14 * dp).toInt(), (10 * dp).toInt(), (14 * dp).toInt(), (10 * dp).toInt())
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    if (idx > 0) topMargin = (8 * dp).toInt()
                }
            }

            val leftCol = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            val tvDate = TextView(this).apply {
                text = item.tanggalLabel ?: item.tanggal ?: "-"
                textSize = 13f
                setTextColor(ContextCompat.getColor(this@AktivitasActivity, R.color.text_primary))
                setTypeface(typeface, android.graphics.Typeface.BOLD)
            }
            val tvTimes = TextView(this).apply {
                text = "Datang: ${item.jamDatang ?: "--:--"} • Pulang: ${item.jamPulang ?: "--:--"}"
                textSize = 11f
                setTextColor(ContextCompat.getColor(this@AktivitasActivity, R.color.text_muted))
            }
            leftCol.addView(tvDate)
            leftCol.addView(tvTimes)

            val isLate = item.status == "Terlambat"
            val tvBadge = TextView(this).apply {
                text = item.status ?: "-"
                textSize = 11f
                setTypeface(typeface, android.graphics.Typeface.BOLD)
                setBackgroundResource(if (isLate) R.drawable.bg_pill_red else R.drawable.bg_pill_green)
                setTextColor(
                    ContextCompat.getColor(
                        this@AktivitasActivity,
                        if (isLate) R.color.danger_red else R.color.badge_green_text
                    )
                )
                setPadding((10 * dp).toInt(), (4 * dp).toInt(), (10 * dp).toInt(), (4 * dp).toInt())
            }

            row.addView(leftCol)
            row.addView(tvBadge)
            container.addView(row)
        }
    }
}
