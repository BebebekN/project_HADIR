package com.psas.hadir.ui

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.psas.hadir.R
import com.psas.hadir.data.api.RetrofitClient
import com.psas.hadir.data.model.DashboardData
import com.psas.hadir.data.model.NotifikasiPresensiDto
import com.psas.hadir.databinding.ActivityMainBinding
import com.psas.hadir.utils.AvatarHelper
import com.psas.hadir.utils.NotificationHelper
import com.psas.hadir.utils.ScheduleTimeUtils
import com.psas.hadir.utils.SessionManager
import kotlinx.coroutines.launch
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var carouselAdapter: JadwalCarouselAdapter
    private var currentNotifData: NotifikasiPresensiDto? = null
    private var pendingManualPushOnGrant = false

    private val notifPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            NotificationHelper.scheduleDailyTenMinuteWarning(this)
            if (pendingManualPushOnGrant) {
                pendingManualPushOnGrant = false
                sendTenMinutePushNow()
            } else {
                currentNotifData?.let { notif ->
                    if (notif.tampilkan && sessionManager.getUser()?.role == "siswa") {
                        NotificationHelper.autoNotifyStudentIfEligible(
                            this,
                            notif.judul ?: "HADIR • Pengingat Absen Siswa",
                            notif.pesan ?: "Batas waktu absen tinggal 10 menit lagi!"
                        )
                    }
                }
            }
        }
    }

    private val scanLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            loadDashboard()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        sessionManager = SessionManager(this)

        if (!sessionManager.isLoggedIn()) {
            goToLogin()
            return
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupNotifications()
        setupCarousel()
        setupListeners()
        bindCachedUser()
        loadDashboard()
    }

    override fun onResume() {
        super.onResume()
        if (::carouselAdapter.isInitialized) {
            carouselAdapter.notifyDataSetChanged()
        }
        BottomNavHelper.bind(this, binding.root, BottomNavTab.BERANDA) {
            scanLauncher.launch(Intent(this, ScannerActivity::class.java))
        }
        bindCachedUser()
        loadDashboard()
    }

    private fun setupCarousel() {
        carouselAdapter = JadwalCarouselAdapter()
        binding.viewPagerJadwal.apply {
            adapter = carouselAdapter
            offscreenPageLimit = 2
            setPageTransformer(CarouselPageTransformer())
        }
    }

    private fun setupListeners() {
        BottomNavHelper.bind(this, binding.root, BottomNavTab.BERANDA) {
            scanLauncher.launch(Intent(this, ScannerActivity::class.java))
        }

        binding.avatarHeaderContainer.setOnClickListener {
            startActivity(Intent(this, ProfilActivity::class.java))
        }
        binding.btnLogout.setOnClickListener { performLogout() }
        binding.btnAktivitasBell.setOnClickListener { showNotificationCenterDialog() }
        binding.btnNotifScanSekarang.setOnClickListener { openAttendanceOrActivityAction() }
        binding.btnNotifPreviewPush.setOnClickListener { triggerManualTenMinuteNotification() }

        binding.btnScanQr.setOnClickListener { openAttendanceOrActivityAction() }

        binding.btnLihatJadwal.setOnClickListener {
            startActivity(Intent(this, JadwalActivity::class.java))
        }
        binding.btnQuickJadwal.setOnClickListener {
            startActivity(Intent(this, JadwalActivity::class.java))
        }
        binding.btnQuickRapot.setOnClickListener {
            startActivity(Intent(this, RapotActivity::class.java))
        }
        binding.btnQuickAktivitas.setOnClickListener {
            startActivity(Intent(this, AktivitasActivity::class.java))
        }
        binding.cardNilaiKedisiplinan.setOnClickListener {
            startActivity(Intent(this, RapotActivity::class.java))
        }

        binding.btnMonitoringGuru.setOnClickListener {
            startActivity(Intent(this, MonitoringActivity::class.java))
        }

        binding.btnPrevSlide.setOnClickListener {
            val current = binding.viewPagerJadwal.currentItem
            if (current > 0) {
                binding.viewPagerJadwal.setCurrentItem(current - 1, true)
            }
        }

        binding.btnNextSlide.setOnClickListener {
            val current = binding.viewPagerJadwal.currentItem
            val total = carouselAdapter.itemCount
            if (current < total - 1) {
                binding.viewPagerJadwal.setCurrentItem(current + 1, true)
            }
        }
    }

    private fun bindCachedUser() {
        val user = sessionManager.getUser() ?: return
        binding.tvAvatarInitials.text = extractInitials(user.namaLengkap)
        AvatarHelper.loadAvatar(
            lifecycleScope,
            binding.ivHeaderAvatar,
            binding.tvAvatarInitials,
            sessionManager.resolveAvatarUrl(user)
        )
        binding.tvGreeting.text = user.namaLengkap
        val isOrangTua = user.role == "orang_tua"
        val kelasLabel = user.kelas ?: "Staf Sekolah"
        binding.tvStudentMeta.text = if (isOrangTua) {
            "Anak: ${user.childName ?: "-"} • NIS ${user.childNis ?: "-"} ($kelasLabel)"
        } else {
            "NIS/NIP: ${user.nisNip} • $kelasLabel"
        }
        binding.btnMonitoringGuru.visibility =
            if (user.role == "guru" || user.role == "admin") View.VISIBLE else View.GONE

        renderScoreAndStars(user.poinKedisiplinan, user.bintang, user.predikat ?: "Sangat Baik (A)")
    }

    private fun loadDashboard() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getService(this@MainActivity).getDashboard()
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        sessionManager.updateUser(data.user)
                        bindDashboardData(data)
                    }
                } else if (response.code() == 401) {
                    sessionManager.clearSession()
                    goToLogin()
                }
            } catch (_: Exception) {
                Toast.makeText(
                    this@MainActivity,
                    "Tidak dapat memperbarui data dari server",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun bindDashboardData(data: DashboardData) {
        val u = data.user
        val isOrangTua = u.role == "orang_tua"
        binding.tvAvatarInitials.text = extractInitials(u.namaLengkap)
        AvatarHelper.loadAvatar(
            lifecycleScope,
            binding.ivHeaderAvatar,
            binding.tvAvatarInitials,
            sessionManager.resolveAvatarUrl(u)
        )
        binding.tvGreeting.text = u.namaLengkap
        binding.tvStudentMeta.text = if (isOrangTua) {
            "Anak: ${u.childName ?: "-"} • NIS ${u.childNis ?: "-"} (${u.kelas ?: "-"})"
        } else {
            "NIS: ${u.nisNip} • ${u.kelas ?: "-"}"
        }
        renderScoreAndStars(u.poinKedisiplinan, u.bintang, u.predikat ?: "Sangat Baik (A)")

        val presensi = data.presensiHariIni
        binding.tvJamDatang.text = presensi.jamDatang ?: "— : —"
        binding.tvJamPulang.text = presensi.jamPulang ?: "— : —"

        val statusText = when {
            presensi.status != null -> presensi.status
            presensi.sudahPresensi -> "Hadir"
            else -> "Belum Hadir"
        }
        binding.tvStatusPresensi.text = statusText

        when (statusText) {
            "Tepat Waktu", "Hadir" -> {
                binding.tvStatusPresensi.setBackgroundResource(R.drawable.bg_pill_green)
                binding.tvStatusPresensi.setTextColor(ContextCompat.getColor(this, R.color.badge_green_text))
            }
            "Terlambat" -> {
                binding.tvStatusPresensi.setBackgroundResource(R.drawable.bg_pill_red)
                binding.tvStatusPresensi.setTextColor(ContextCompat.getColor(this, R.color.danger_red))
            }
            else -> {
                binding.tvStatusPresensi.setBackgroundResource(R.drawable.bg_pill_outline)
                binding.tvStatusPresensi.setTextColor(ContextCompat.getColor(this, R.color.text_muted))
            }
        }

        if (isOrangTua) {
            binding.btnScanQr.text = "Lihat Aktivitas & Riwayat Anak"
            binding.btnScanQr.setIconResource(R.drawable.ic_assignment)
        } else {
            binding.btnScanQr.setIconResource(R.drawable.ic_qr_code)
            binding.btnScanQr.text = when {
                !presensi.sudahPresensi -> "Scan QR Datang"
                presensi.jamPulang == null -> "Scan QR Pulang"
                else -> "Presensi Hari Ini Selesai"
            }
        }

        val jadwalToday = data.jadwalHariIni
        val isWeekend = jadwalToday.isWeekend || ScheduleTimeUtils.isWeekendNow()
        binding.tvCarouselTitle.text = "Jadwal Hari Ini (${jadwalToday.hari})"

        if (isWeekend) {
            binding.viewPagerJadwal.visibility = View.GONE
            binding.btnPrevSlide.visibility = View.GONE
            binding.btnNextSlide.visibility = View.GONE
            binding.cardWeekend.visibility = View.VISIBLE
            binding.tvWeekendDesc.text =
                jadwalToday.pesanLibur ?: getString(R.string.weekend_subtitle)
        } else {
            binding.cardWeekend.visibility = View.GONE
            binding.viewPagerJadwal.visibility = View.VISIBLE
            binding.btnPrevSlide.visibility = View.VISIBLE
            binding.btnNextSlide.visibility = View.VISIBLE
            carouselAdapter.submitList(jadwalToday.items, jadwalToday.hari)
        }

        renderAttendanceNotification(data, isOrangTua, isWeekend)
    }

    private fun setupNotifications() {
        NotificationHelper.ensureChannel(this)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            !NotificationHelper.hasNotificationPermission(this)
        ) {
            notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            NotificationHelper.scheduleDailyTenMinuteWarning(this)
        }
    }

    private fun openAttendanceOrActivityAction() {
        val isOrangTua = sessionManager.getUser()?.role == "orang_tua"
        if (isOrangTua) {
            startActivity(Intent(this, AktivitasActivity::class.java))
        } else {
            scanLauncher.launch(Intent(this, ScannerActivity::class.java))
        }
    }

    private fun renderAttendanceNotification(
        data: DashboardData,
        isOrangTua: Boolean,
        isWeekend: Boolean
    ) {
        val sudahPresensi = data.presensiHariIni.sudahPresensi
        val notif = data.notifikasiPresensi
        currentNotifData = notif

        val shouldShow = !sudahPresensi && !isWeekend && (notif?.tampilkan != false)
        if (shouldShow) {
            binding.tvNotifBadge.visibility = View.VISIBLE
            binding.cardNotifReminder.visibility = View.VISIBLE
            binding.tvNotifBannerTitle.text = notif?.judul ?: "Peringatan Batas Waktu Absen!"
            binding.tvNotifBannerBadge.text = notif?.badge ?: "10 Menit Lagi"
            binding.tvNotifBannerDesc.text = notif?.pesan ?: if (isOrangTua) {
                "${data.user.childName ?: "Anak"} belum melakukan scan QR datang hari ini."
            } else {
                "Batas waktu absen tinggal 10 menit lagi! Segera lakukan presensi QR di kawasan SMK Telkom Purwokerto."
            }
            binding.btnNotifScanSekarang.text = if (isOrangTua) "Pantau Aktivitas" else "Scan QR Sekarang"

            if (data.user.role == "siswa" && NotificationHelper.hasNotificationPermission(this)) {
                val pushTitle = "HADIR • ${notif?.judul ?: "Peringatan Batas Waktu Absen!"}"
                val pushBody = notif?.pesan
                    ?: "Batas waktu absen tinggal 10 menit lagi! Segera scan QR di SMK Telkom Purwokerto."
                NotificationHelper.autoNotifyStudentIfEligible(this, pushTitle, pushBody)
            }
        } else {
            binding.tvNotifBadge.visibility = View.GONE
            binding.cardNotifReminder.visibility = View.GONE
        }
    }

    private fun showNotificationCenterDialog() {
        val notif = currentNotifData
        val user = sessionManager.getUser()
        val isOrangTua = user?.role == "orang_tua"
        val message = when {
            notif != null && !notif.tampilkan && notif.sudahPresensi ->
                "Presensi hari ini sudah tercatat.\n\n${notif.pesan ?: ""}\n\n" +
                    "Catatan: Pengingat batas waktu absen H-10 menit (06:50 WIB) aktif otomatis setiap hari sekolah."
            notif != null ->
                "${notif.judul ?: "Peringatan Batas Waktu Absen!"}\n\n" +
                    "${notif.pesan ?: ""}\n\n" +
                    "• Jadwal Pengingat Otomatis: 06:50 WIB (10 menit sebelum batas 07:00 WIB)"
            else ->
                "Peringatan untuk siswa: batas waktu absen tinggal 10 menit lagi (pukul 07:00 WIB). Segera lakukan Scan QR di kawasan SMK Telkom Purwokerto."
        }

        AlertDialog.Builder(this)
            .setTitle("Notifikasi Aplikasi HADIR")
            .setMessage(message)
            .setPositiveButton("Uji Notif 10 Menit (HP)") { _, _ ->
                triggerManualTenMinuteNotification()
            }
            .setNeutralButton(if (isOrangTua) "Buka Aktivitas" else "Scan QR") { _, _ ->
                openAttendanceOrActivityAction()
            }
            .setNegativeButton("Tutup", null)
            .show()
    }

    private fun triggerManualTenMinuteNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            !NotificationHelper.hasNotificationPermission(this)
        ) {
            pendingManualPushOnGrant = true
            notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            return
        }
        sendTenMinutePushNow()
    }

    private fun sendTenMinutePushNow() {
        val sent = NotificationHelper.showTenMinuteWarningSample(this)
        Toast.makeText(
            this,
            if (sent) {
                "Notifikasi HADIR (10 menit lagi) dikirim ke bilah notifikasi HP!"
            } else {
                "Izinkan notifikasi aplikasi HADIR di Pengaturan HP Anda."
            },
            Toast.LENGTH_LONG
        ).show()
    }

    private fun renderScoreAndStars(poin: Int, bintang: Double, predikat: String) {
        binding.tvPoinScore.text = poin.toString()
        binding.tvBintangValue.text = String.format(Locale.US, "%.1f ★", bintang)
        binding.tvPredikat.text = predikat
        binding.progressPoin.progress = poin

        val starViews = listOf(binding.star1, binding.star2, binding.star3, binding.star4, binding.star5)
        val filledCount = bintang.toInt()
        starViews.forEachIndexed { idx, img ->
            img.setImageResource(
                if (idx < filledCount) R.drawable.ic_star_filled else R.drawable.ic_star_outline
            )
        }
    }

    private fun extractInitials(fullName: String): String {
        return fullName.trim().split(" ")
            .filter { it.isNotBlank() }
            .take(2)
            .joinToString("") { it.first().uppercase() }
            .ifEmpty { "S" }
    }

    private fun performLogout() {
        lifecycleScope.launch {
            try {
                RetrofitClient.getService(this@MainActivity).logout()
            } catch (_: Exception) {
            } finally {
                sessionManager.clearSession()
                goToLogin()
            }
        }
    }

    private fun goToLogin() {
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }
}
