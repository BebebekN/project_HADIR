package com.psas.hadir.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.widget.ImageView
import android.widget.Toast
import androidx.transition.AutoTransition
import androidx.transition.TransitionManager
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import com.psas.hadir.data.api.RetrofitClient
import com.psas.hadir.databinding.ActivityProfilBinding
import com.psas.hadir.utils.AvatarHelper
import com.psas.hadir.utils.NotificationHelper
import com.psas.hadir.utils.SessionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

class ProfilActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfilBinding
    private lateinit var sessionManager: SessionManager
    private var pendingCameraUri: Uri? = null

    private val galleryLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            uploadSelectedPhoto(uri)
        }
    }

    private val cameraLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { captured ->
        if (captured) {
            pendingCameraUri?.let { uploadSelectedPhoto(it) }
        }
    }

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            openCameraCapture()
        } else {
            Toast.makeText(
                this,
                "Izin kamera diperlukan untuk mengambil foto profil.",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    private val notifPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            NotificationHelper.scheduleDailyTenMinuteWarning(this)
            sendTestNotification()
        } else {
            Toast.makeText(
                this,
                "Izin notifikasi ditolak. Aktifkan di Pengaturan HP untuk melihat notif HADIR.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfilBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)
        binding.btnBackProfil.setOnClickListener { finish() }
        BottomNavHelper.bind(this, binding.root, BottomNavTab.PROFIL)

        bindProfile()
        refreshProfileFromServer()
        setupAccordions()

        binding.avatarProfilContainer.setOnClickListener { showPhotoPickerDialog() }
        binding.btnEditFotoAvatar.setOnClickListener { showPhotoPickerDialog() }
        binding.btnGantiFotoProfil.setOnClickListener { showPhotoPickerDialog() }
        binding.rowGantiFoto.setOnClickListener { showPhotoPickerDialog() }
        binding.btnHapusFotoProfil.setOnClickListener { confirmDeletePhoto() }

        binding.rowServerConfig.setOnClickListener { showServerConfigDialog() }
        binding.btnProfilTestNotif.setOnClickListener { triggerTestNotification() }
        binding.btnProfilLogout.setOnClickListener { performLogout() }
    }

    private fun refreshProfileFromServer() {
        lifecycleScope.launch {
            try {
                val res = RetrofitClient.getService(this@ProfilActivity).getProfile()
                if (res.isSuccessful && res.body()?.success == true) {
                    res.body()?.data?.let { freshUser ->
                        sessionManager.updateUser(freshUser)
                        bindProfile()
                    }
                }
            } catch (_: Exception) {
                // Keep cached session offline
            }
        }
    }

    private fun bindProfile() {
        val user = sessionManager.getUser()
        if (user != null) {
            val initials = user.namaLengkap.trim().split(" ")
                .filter { it.isNotBlank() }
                .take(2)
                .joinToString("") { it.first().uppercase() }
                .ifEmpty { "S" }

            binding.tvProfilInitials.text = initials
            binding.tvProfilNama.text = user.namaLengkap
            binding.tvProfilNis.text = "NIS/NIP: ${user.nisNip}"
            binding.tvProfilEmail.text = user.email ?: "${user.nisNip}@student.smktelkom-pwt.sch.id"
            binding.tvProfilHeaderSubtitle.text = "${user.nisNip} • ${user.kelas ?: user.role}"
            binding.tvProfilKelas.text = when {
                user.role == "orang_tua" ->
                    "Orang Tua dari ${user.childName ?: "-"} (${user.kelas ?: "XI PPLG 4"})"
                user.kelas != null ->
                    "${user.kelas} • Rekayasa Perangkat Lunak (SMK Telkom Purwokerto)"
                else -> "Guru / Pembina • ${user.role}"
            }
            binding.tvProfilWaliKelas.text = "Wali Kelas XI PPLG 4: Firda Ayu Nirmala, S.Kom"

            binding.tvRowIdentitasTitle.text = "Detail Identitas (${user.role.uppercase()})"
            binding.tvDetailNama.text = "Nama: ${user.namaLengkap}"
            binding.tvDetailNis.text = "NIS / NIP: ${user.nisNip}"
            binding.tvDetailEmail.text = "Email Sekolah: ${user.email ?: "-"}"
            binding.tvDetailKelas.text = "Kelas: ${user.kelas ?: "Guru / Pembimbing"}"

            val avatarUrl = sessionManager.resolveAvatarUrl(user)
            AvatarHelper.loadAvatar(
                lifecycleScope,
                binding.ivProfilAvatar,
                binding.tvProfilInitials,
                avatarUrl
            )
            binding.btnHapusFotoProfil.visibility =
                if (!avatarUrl.isNullOrBlank()) View.VISIBLE else View.GONE
        }
        binding.tvProfilEndpoint.text = sessionManager.getBaseUrl()
    }

    private fun showPhotoPickerDialog() {
        val hasAvatar = !sessionManager.resolveAvatarUrl().isNullOrBlank()
        val options = mutableListOf(
            "Pilih dari Galeri HP",
            "Ambil Foto dengan Kamera"
        )
        if (hasAvatar) {
            options.add("Hapus Foto Profil (Kembali ke Inisial)")
        }

        AlertDialog.Builder(this)
            .setTitle("Edit Foto Profil")
            .setItems(options.toTypedArray()) { _, idx ->
                when (idx) {
                    0 -> galleryLauncher.launch("image/*")
                    1 -> launchCameraWithPermission()
                    2 -> confirmDeletePhoto()
                }
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    private fun launchCameraWithPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) ==
            PackageManager.PERMISSION_GRANTED
        ) {
            openCameraCapture()
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun openCameraCapture() {
        val cameraDir = File(cacheDir, "camera").apply { mkdirs() }
        val photoFile = File(cameraDir, "avatar_capture_${System.currentTimeMillis()}.jpg")
        val uri = FileProvider.getUriForFile(
            this,
            "$packageName.fileprovider",
            photoFile
        )
        pendingCameraUri = uri
        cameraLauncher.launch(uri)
    }

    private fun uploadSelectedPhoto(uri: Uri) {
        setAvatarUploading(true)
        lifecycleScope.launch {
            try {
                val part = withContext(Dispatchers.IO) {
                    AvatarHelper.createCompressedMultipart(this@ProfilActivity, uri)
                }
                if (part == null) {
                    Toast.makeText(
                        this@ProfilActivity,
                        "Gagal membaca file gambar. Pilih foto lain.",
                        Toast.LENGTH_SHORT
                    ).show()
                    return@launch
                }

                val oldUrl = sessionManager.resolveAvatarUrl()
                val res = RetrofitClient.getService(this@ProfilActivity).uploadProfilePhoto(part)
                if (res.isSuccessful && res.body()?.success == true) {
                    res.body()?.data?.let { updatedUser ->
                        AvatarHelper.invalidate(oldUrl)
                        sessionManager.updateUser(updatedUser)
                        bindProfile()
                    }
                    Toast.makeText(
                        this@ProfilActivity,
                        res.body()?.message ?: "Foto profil berhasil diperbarui!",
                        Toast.LENGTH_SHORT
                    ).show()
                } else {
                    Toast.makeText(
                        this@ProfilActivity,
                        "Gagal mengunggah foto ke server (HTTP ${res.code()}).",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@ProfilActivity,
                    "Tidak dapat terhubung ke server: ${e.message ?: "Coba lagi"}",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                setAvatarUploading(false)
            }
        }
    }

    private fun confirmDeletePhoto() {
        AlertDialog.Builder(this)
            .setTitle("Hapus Foto Profil?")
            .setMessage("Foto profil akan dikembalikan ke inisial nama Anda.")
            .setPositiveButton("Hapus") { _, _ -> deletePhoto() }
            .setNegativeButton("Batal", null)
            .show()
    }

    private fun deletePhoto() {
        setAvatarUploading(true)
        lifecycleScope.launch {
            try {
                val oldUrl = sessionManager.resolveAvatarUrl()
                val res = RetrofitClient.getService(this@ProfilActivity).deleteProfilePhoto()
                if (res.isSuccessful && res.body()?.success == true) {
                    AvatarHelper.invalidate(oldUrl)
                    res.body()?.data?.let { updatedUser ->
                        sessionManager.updateUser(updatedUser)
                        bindProfile()
                    }
                    Toast.makeText(
                        this@ProfilActivity,
                        "Foto profil dihapus.",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (_: Exception) {
                Toast.makeText(
                    this@ProfilActivity,
                    "Gagal menghapus foto profil.",
                    Toast.LENGTH_SHORT
                ).show()
            } finally {
                setAvatarUploading(false)
            }
        }
    }

    private fun setAvatarUploading(loading: Boolean) {
        binding.progressProfilAvatar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnGantiFotoProfil.isEnabled = !loading
        binding.btnEditFotoAvatar.isEnabled = !loading
        binding.rowGantiFoto.isEnabled = !loading
        binding.btnHapusFotoProfil.isEnabled = !loading
    }

    private fun setupAccordions() {
        val entries = listOf(
            Pair(binding.layoutDetailIdentitas, binding.ivChevronIdentitas),
            Pair(binding.layoutDetailKeamanan, binding.ivChevronKeamanan),
            Pair(binding.layoutDetailAturan, binding.ivChevronAturan),
            Pair(binding.layoutDetailNotif, binding.ivChevronNotif),
            Pair(binding.layoutDetailBantuan, binding.ivChevronBantuan)
        )
        bindAccordionRow(binding.rowProfilIdentitas, binding.layoutDetailIdentitas, binding.ivChevronIdentitas, entries)
        bindAccordionRow(binding.rowKeamananAkun, binding.layoutDetailKeamanan, binding.ivChevronKeamanan, entries)
        bindAccordionRow(binding.rowAturanSkor, binding.layoutDetailAturan, binding.ivChevronAturan, entries)
        bindAccordionRow(binding.rowNotifReminder, binding.layoutDetailNotif, binding.ivChevronNotif, entries)
        bindAccordionRow(binding.rowBantuanWali, binding.layoutDetailBantuan, binding.ivChevronBantuan, entries)

        listOf(binding.rowGantiFoto, binding.rowServerConfig).forEach { row ->
            row.setOnTouchListener { v, event ->
                when (event.actionMasked) {
                    android.view.MotionEvent.ACTION_DOWN -> v.animate().scaleX(0.98f).scaleY(0.98f).setDuration(90).start()
                    android.view.MotionEvent.ACTION_UP, android.view.MotionEvent.ACTION_CANCEL ->
                        v.animate().scaleX(1f).scaleY(1f).setDuration(140).start()
                }
                false
            }
        }
    }

    private fun bindAccordionRow(
        row: View,
        targetPanel: View,
        targetChevron: ImageView,
        allEntries: List<Pair<View, ImageView>>
    ) {
        row.setOnClickListener {
            row.animate()
                .scaleX(0.98f)
                .scaleY(0.98f)
                .setDuration(90)
                .withEndAction {
                    row.animate().scaleX(1f).scaleY(1f).setDuration(150).start()
                }
                .start()

            val transition = AutoTransition().apply {
                duration = 240
                interpolator = DecelerateInterpolator()
            }
            TransitionManager.beginDelayedTransition(binding.profilContentContainer, transition)

            val shouldOpen = targetPanel.visibility != View.VISIBLE
            allEntries.forEach { (panel, chevron) ->
                val openThis = shouldOpen && panel == targetPanel
                panel.visibility = if (openThis) View.VISIBLE else View.GONE
                chevron.animate().rotation(if (openThis) 90f else 0f).setDuration(220).start()
            }
        }
    }

    private fun triggerTestNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            !NotificationHelper.hasNotificationPermission(this)
        ) {
            notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            return
        }
        sendTestNotification()
    }

    private fun sendTestNotification() {
        val sent = NotificationHelper.showTenMinuteWarningSample(this)
        Toast.makeText(
            this,
            if (sent) {
                "Notifikasi HADIR dikirim! Cek bilah notifikasi atas HP Anda."
            } else {
                "Gagal menampilkan notifikasi. Periksa izin notifikasi aplikasi."
            },
            Toast.LENGTH_LONG
        ).show()
    }

    private fun showServerConfigDialog() {
        ServerConfigDialog.show(this, sessionManager) { updatedUrl ->
            binding.tvProfilEndpoint.text = updatedUrl
            bindProfile()
        }
    }

    private fun performLogout() {
        lifecycleScope.launch {
            try {
                RetrofitClient.getService(this@ProfilActivity).logout()
            } catch (_: Exception) {
            } finally {
                sessionManager.clearSession()
                startActivity(
                    Intent(this@ProfilActivity, LoginActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                )
                finish()
            }
        }
    }
}
