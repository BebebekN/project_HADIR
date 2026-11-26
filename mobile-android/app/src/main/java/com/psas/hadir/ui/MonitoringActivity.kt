package com.psas.hadir.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.psas.hadir.R
import com.psas.hadir.data.api.RetrofitClient
import com.psas.hadir.databinding.ActivityMonitoringBinding
import com.psas.hadir.utils.SessionManager
import kotlinx.coroutines.launch
import java.util.Locale

class MonitoringActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMonitoringBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var adapter: StudentMonitoringAdapter
    private var selectedKelas = "XI PPLG 4"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMonitoringBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)
        adapter = StudentMonitoringAdapter()

        binding.rvMonitoring.layoutManager = LinearLayoutManager(this)
        binding.rvMonitoring.adapter = adapter

        binding.btnBackMonitoring.setOnClickListener {
            if (isTaskRoot) {
                performLogout()
            } else {
                finish()
            }
        }

        binding.btnLogoutMonitoring.setOnClickListener {
            performLogout()
        }

        binding.chipGroupKelas.setOnCheckedStateChangeListener { _, checkedIds ->
            val checkedId = checkedIds.firstOrNull() ?: return@setOnCheckedStateChangeListener
            selectedKelas = when (checkedId) {
                R.id.chipXiPplg4 -> "XI PPLG 4"
                R.id.chipXiPplg1 -> "XI PPLG 1"
                R.id.chipXiPplg2 -> "XI PPLG 2"
                else -> "XI PPLG 4"
            }
            loadMonitoring()
        }

        loadMonitoring()
    }

    private fun performLogout() {
        lifecycleScope.launch {
            try {
                RetrofitClient.getService(this@MonitoringActivity).logout()
            } catch (_: Exception) {
            } finally {
                sessionManager.clearSession()
                startActivity(
                    Intent(this@MonitoringActivity, LoginActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                )
                finish()
            }
        }
    }

    private fun loadMonitoring() {
        binding.progressMonitoring.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getService(this@MonitoringActivity)
                    .getGuruMonitoring(selectedKelas)

                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        binding.tvMonitoringSubtitle.text = "${data.kelas} • Wali Kelas: Firda Ayu Nirmala, S.Kom"
                        binding.tvStatHadir.text =
                            "${data.ringkasan.hadirHariIni} / ${data.ringkasan.totalSiswa}"
                        binding.tvStatBintang.text =
                            String.format(Locale.US, "%.1f ★", data.ringkasan.rataRataBintang)
                        adapter.submitList(data.siswa)
                    }
                } else {
                    Toast.makeText(this@MonitoringActivity, "Gagal memuat monitoring", Toast.LENGTH_SHORT).show()
                }
            } catch (_: Exception) {
                Toast.makeText(this@MonitoringActivity, "Gagal terhubung ke API", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressMonitoring.visibility = View.GONE
            }
        }
    }
}
