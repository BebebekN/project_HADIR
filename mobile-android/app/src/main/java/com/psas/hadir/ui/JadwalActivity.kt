package com.psas.hadir.ui

import android.os.Bundle
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.psas.hadir.R
import com.psas.hadir.data.api.RetrofitClient
import com.psas.hadir.data.model.JadwalItem
import com.psas.hadir.databinding.ActivityJadwalBinding
import com.psas.hadir.utils.ScheduleTimeUtils
import com.psas.hadir.utils.SessionManager
import kotlinx.coroutines.launch

class JadwalActivity : AppCompatActivity() {

    private lateinit var binding: ActivityJadwalBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var adapter: JadwalListAdapter

    private var weeklySchedule: Map<String, List<JadwalItem>> = emptyMap()
    private var selectedHari: String = "Senin"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityJadwalBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)
        adapter = JadwalListAdapter()

        binding.rvJadwal.layoutManager = LinearLayoutManager(this)
        binding.rvJadwal.adapter = adapter

        binding.btnBack.setOnClickListener { finish() }
        BottomNavHelper.bind(this, binding.root, BottomNavTab.JADWAL)

        setupDayTabs()
        loadJadwal()
    }

    override fun onResume() {
        super.onResume()
        if (::adapter.isInitialized) {
            adapter.notifyDataSetChanged()
        }
        loadJadwal()
    }

    private fun setupDayTabs() {
        val dayMap = linkedMapOf(
            "Senin" to binding.tabSenin,
            "Selasa" to binding.tabSelasa,
            "Rabu" to binding.tabRabu,
            "Kamis" to binding.tabKamis,
            "Jumat" to binding.tabJumat
        )

        val currentDay = ScheduleTimeUtils.getCurrentDayName()
        selectedHari = if (dayMap.containsKey(currentDay)) currentDay else "Senin"
        binding.tvTodayBadge.text = if (ScheduleTimeUtils.isWeekendNow()) "Akhir Pekan" else currentDay

        if (ScheduleTimeUtils.isWeekendNow()) {
            binding.bannerWeekend.visibility = View.VISIBLE
        }

        fun updateTabStyles() {
            val white = ContextCompat.getColor(this, R.color.white)
            val muted = ContextCompat.getColor(this, R.color.text_muted)
            dayMap.forEach { (hari, tv: TextView) ->
                val active = hari == selectedHari
                tv.setBackgroundResource(if (active) R.drawable.bg_pill_blue else R.drawable.bg_pill_outline)
                tv.setTextColor(if (active) white else muted)
            }
        }

        updateTabStyles()
        dayMap.forEach { (hari, tv) ->
            tv.setOnClickListener {
                selectedHari = hari
                updateTabStyles()
                renderDaySchedule()
            }
        }
    }

    private fun loadJadwal() {
        val user = sessionManager.getUser()
        val kelas = user?.kelas ?: "XI PPLG 4"
        binding.tvJadwalInfo.text = "$kelas • Real-Time"
        binding.progressJadwal.visibility = View.VISIBLE

        lifecycleScope.launch {
            try {
                val service = RetrofitClient.getService(this@JadwalActivity)
                val response = service.getJadwal(kelas)
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        weeklySchedule = data.jadwalMingguan
                        binding.tvJadwalInfo.text = "${data.kelas} • ${data.jamSekarang}"
                        binding.tvTodayBadge.text =
                            if (data.isWeekend) "Akhir Pekan" else data.hariIni
                        if (data.isWeekend) {
                            binding.bannerWeekend.visibility = View.VISIBLE
                        }
                        renderDaySchedule()
                    }
                } else {
                    Toast.makeText(this@JadwalActivity, "Gagal mengambil jadwal", Toast.LENGTH_SHORT).show()
                }

                val presensiRes = service.getTodayPresensi()
                if (presensiRes.isSuccessful && presensiRes.body()?.success == true) {
                    val p = presensiRes.body()?.data
                    binding.tvJadwalDatang.text = p?.jamDatang ?: "--:--"
                    binding.tvJadwalPulang.text = p?.jamPulang ?: "--:--"
                }
            } catch (_: Exception) {
                Toast.makeText(this@JadwalActivity, "Kesalahan jaringan", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressJadwal.visibility = View.GONE
            }
        }
    }

    private fun renderDaySchedule() {
        val list = weeklySchedule[selectedHari] ?: emptyList()
        adapter.submitList(list, selectedHari)
    }
}
