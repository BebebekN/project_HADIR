package com.psas.hadir.ui

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.psas.hadir.R
import com.psas.hadir.data.api.RetrofitClient
import com.psas.hadir.databinding.ActivityRapotBinding
import com.psas.hadir.utils.SessionManager
import kotlinx.coroutines.launch
import java.util.Locale

class RapotActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRapotBinding
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRapotBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)
        binding.btnBackRapot.setOnClickListener { finish() }
        BottomNavHelper.bind(this, binding.root, BottomNavTab.RAPOT)

        bindCached()
        loadRapot()
    }

    override fun onResume() {
        super.onResume()
        loadRapot()
    }

    private fun bindCached() {
        val u = sessionManager.getUser() ?: return
        binding.tvRapotStudent.text = "${u.namaLengkap} • ${u.kelas ?: "Siswa"}"
        renderEligibility(u.poinKedisiplinan, u.bintang)
    }

    private fun loadRapot() {
        lifecycleScope.launch {
            try {
                val res = RetrofitClient.getService(this@RapotActivity).getDashboard()
                if (res.isSuccessful && res.body()?.success == true) {
                    val data = res.body()?.data ?: return@launch
                    val u = data.user
                    sessionManager.updateUser(u)
                    binding.tvRapotStudent.text = "${u.namaLengkap} • ${u.kelas ?: "Siswa"}"
                    renderEligibility(u.poinKedisiplinan, u.bintang)

                    val stats = data.statistikKehadiran
                    if (stats != null) {
                        binding.tvRapotPersen.text = stats.persentaseKedisiplinan
                        binding.tvRapotTepat.text = "${stats.tepatWaktu}x Tepat"
                        binding.tvRapotTerlambat.text = stats.terlambat.toString()
                    }
                    binding.tvRapotPoin.text = u.poinKedisiplinan.toString()
                }
            } catch (_: Exception) {
                Toast.makeText(this@RapotActivity, "Gagal memuat data Rapot PKL", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun renderEligibility(poin: Int, bintang: Double) {
        val filled = bintang.toInt()
        val stars = listOf(binding.rStar1, binding.rStar2, binding.rStar3, binding.rStar4, binding.rStar5)
        stars.forEachIndexed { idx, iv ->
            iv.setImageResource(
                if (idx < filled) R.drawable.ic_star_filled else R.drawable.ic_star_outline
            )
            iv.setColorFilter(ContextCompat.getColor(this, R.color.white))
        }

        binding.tvRapotPoin.text = poin.toString()

        when {
            bintang >= 5.0 -> {
                binding.tvRapotHeadline.text = "5.0 / 5 Bintang • Kehadiran Sempurna"
                binding.tvRapotBadge.text = "Lolos PKL Luar Kota"
                binding.badgeKelayakan.setBackgroundResource(R.drawable.bg_pill_green)
                binding.tvRapotBadge.setTextColor(ContextCompat.getColor(this, R.color.badge_green_text))
                binding.tvRapotDesc.text =
                    "Kedisiplinan sangat baik tanpa keterlambatan berlebih. Memenuhi syarat penempatan PKL di luar kota."
            }
            bintang >= 3.0 -> {
                binding.tvRapotHeadline.text = String.format(Locale.US, "%.1f / 5 Bintang • Evaluasi", bintang)
                binding.tvRapotBadge.text = "Evaluasi Pembina"
                binding.badgeKelayakan.setBackgroundResource(R.drawable.bg_pill_orange)
                binding.tvRapotBadge.setTextColor(ContextCompat.getColor(this, R.color.badge_orange_text))
                binding.tvRapotDesc.text =
                    "Terdapat catatan keterlambatan. Tingkatkan ketepatan datang sebelum pukul 07:00 WIB."
            }
            else -> {
                binding.tvRapotHeadline.text = String.format(Locale.US, "%.1f / 5 Bintang • Pembinaan", bintang)
                binding.tvRapotBadge.text = "PKL di Sekolah"
                binding.badgeKelayakan.setBackgroundResource(R.drawable.bg_pill_red)
                binding.tvRapotBadge.setTextColor(ContextCompat.getColor(this, R.color.danger_red))
                binding.tvRapotDesc.text =
                    "Poin kedisiplinan di bawah standar minimal. Diperlukan pembinaan wali kelas dan guru PKL."
            }
        }
    }
}
