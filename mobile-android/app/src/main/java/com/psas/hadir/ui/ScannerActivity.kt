package com.psas.hadir.ui

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.Looper
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.OptIn
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.core.location.LocationManagerCompat
import androidx.lifecycle.lifecycleScope
import com.google.gson.Gson
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.psas.hadir.R
import com.psas.hadir.data.api.RetrofitClient
import com.psas.hadir.data.model.ApiResponse
import com.psas.hadir.data.model.ScanRequest
import com.psas.hadir.data.model.ScanResultData
import com.psas.hadir.databinding.ActivityScannerBinding
import kotlinx.coroutines.launch
import java.util.Locale
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.math.roundToInt

class ScannerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityScannerBinding
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var locationManager: LocationManager

    private var camera: Camera? = null
    private var isFlashOn = false
    private var isProcessing = false

    private var schoolName = "SMK Telkom Purwokerto"
    private var schoolLat = -7.435210
    private var schoolLng = 109.249210
    private var schoolRadiusMeters = 150.0
    private var currentLocation: Location? = null

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            if (isBetterLocation(location, currentLocation)) {
                currentLocation = location
            }
            updateGpsBanner()
        }

        @Deprecated("Deprecated in Android API")
        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        override fun onProviderEnabled(provider: String) {
            updateGpsBanner()
        }

        override fun onProviderDisabled(provider: String) {
            updateGpsBanner()
        }
    }

    private val requestPermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val camGranted = grants[Manifest.permission.CAMERA] == true ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        if (camGranted) {
            startCamera()
        } else {
            Toast.makeText(
                this,
                "Izin kamera ditolak. Anda masih dapat memasukkan kode QR dari Admin di bawah.",
                Toast.LENGTH_LONG
            ).show()
        }

        if (hasLocationPermission()) {
            startLocationUpdates()
        } else {
            updateGpsBanner()
            Toast.makeText(
                this,
                "Izin lokasi GPS wajib diaktifkan untuk absen di SMK Telkom Purwokerto.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScannerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        cameraExecutor = Executors.newSingleThreadExecutor()
        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager

        binding.btnBackScanner.setOnClickListener { finish() }

        binding.btnFlash.setOnClickListener {
            camera?.let { cam ->
                if (cam.cameraInfo.hasFlashUnit()) {
                    isFlashOn = !isFlashOn
                    cam.cameraControl.enableTorch(isFlashOn)
                }
            }
        }

        setupModePills()

        binding.btnRefreshGps.setOnClickListener {
            if (!hasLocationPermission()) {
                requestPermissionsIfNeeded()
            } else {
                startLocationUpdates()
                Toast.makeText(this, "Memperbarui koordinat GPS...", Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnSubmitManual.setOnClickListener {
            val token = binding.etManualToken.text.toString().trim()
            if (token.isNotEmpty() && !isProcessing) {
                submitQrToken(token)
            } else if (token.isEmpty()) {
                Toast.makeText(this, "Masukkan kode QR resmi dari Admin terlebih dahulu.", Toast.LENGTH_SHORT).show()
            }
        }

        syncSchoolGeofenceConfig()
        requestPermissionsIfNeeded()
    }

    private fun setupModePills() {
        val modes = listOf(binding.tabModeKehadiran, binding.tabModeKelas, binding.tabModeEvent)
        fun selectMode(selected: TextView) {
            val white = ContextCompat.getColor(this, R.color.white)
            val muted = ContextCompat.getColor(this, R.color.text_muted)
            modes.forEach { tv ->
                val active = tv == selected
                tv.setBackgroundResource(if (active) R.drawable.bg_pill_blue else R.drawable.bg_pill_outline)
                tv.setTextColor(if (active) white else muted)
            }
        }
        modes.forEach { tv -> tv.setOnClickListener { selectMode(tv) } }
    }

    private fun syncSchoolGeofenceConfig() {
        lifecycleScope.launch {
            try {
                val res = RetrofitClient.getService(this@ScannerActivity).getTodayPresensi()
                val geo = res.body()?.data?.schoolGeofence
                if (res.isSuccessful && geo != null) {
                    schoolName = geo.name
                    schoolLat = geo.latitude
                    schoolLng = geo.longitude
                    schoolRadiusMeters = geo.radiusMeters
                    binding.tvGpsTitle.text = "Kawasan $schoolName"
                    updateGpsBanner()
                }
            } catch (_: Exception) {
                // Keep defaults
            }
        }
    }

    private fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) ==
            PackageManager.PERMISSION_GRANTED
    }

    private fun hasLocationPermission(): Boolean {
        val fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    private fun requestPermissionsIfNeeded() {
        val missing = mutableListOf<String>()
        if (!hasCameraPermission()) missing.add(Manifest.permission.CAMERA)
        if (!hasLocationPermission()) {
            missing.add(Manifest.permission.ACCESS_FINE_LOCATION)
            missing.add(Manifest.permission.ACCESS_COARSE_LOCATION)
        }

        if (missing.isEmpty()) {
            startCamera()
            startLocationUpdates()
        } else {
            requestPermissionsLauncher.launch(missing.toTypedArray())
        }
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates() {
        if (!hasLocationPermission()) {
            updateGpsBanner()
            return
        }

        val providers = locationManager.allProviders
        providers.forEach { provider ->
            try {
                locationManager.getLastKnownLocation(provider)?.let { last ->
                    if (isBetterLocation(last, currentLocation)) {
                        currentLocation = last
                    }
                }
                if (locationManager.isProviderEnabled(provider)) {
                    locationManager.requestLocationUpdates(
                        provider,
                        2000L,
                        2f,
                        locationListener,
                        Looper.getMainLooper()
                    )
                }
            } catch (_: Exception) {
                // Ignore provider unavailable on certain ROMs
            }
        }
        updateGpsBanner()
    }

    private fun isMockLocation(location: Location): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            location.isMock
        } else {
            @Suppress("DEPRECATION")
            location.isFromMockProvider
        }
    }

    private fun isBetterLocation(candidate: Location, current: Location?): Boolean {
        if (current == null) return true
        val timeDelta = candidate.time - current.time
        val isSignificantlyNewer = timeDelta > 60_000
        val isNewer = timeDelta > 0
        if (isSignificantlyNewer) return true

        val accuracyDelta = (candidate.accuracy - current.accuracy).toInt()
        val isMoreAccurate = accuracyDelta < 0
        return isMoreAccurate || (isNewer && accuracyDelta <= 20)
    }

    private fun distanceToSchoolMeters(location: Location): Double {
        val result = FloatArray(1)
        Location.distanceBetween(
            location.latitude,
            location.longitude,
            schoolLat,
            schoolLng,
            result
        )
        return result[0].toDouble()
    }

    private fun updateGpsBanner() {
        if (!hasLocationPermission()) {
            binding.cardGpsStatus.setBackgroundResource(R.drawable.bg_pill_red)
            binding.tvGpsStatus.setTextColor(ContextCompat.getColor(this, R.color.danger_red))
            binding.tvGpsStatus.text = "Izin lokasi GPS belum diberikan"
            return
        }

        if (!LocationManagerCompat.isLocationEnabled(locationManager)) {
            binding.cardGpsStatus.setBackgroundResource(R.drawable.bg_pill_red)
            binding.tvGpsStatus.setTextColor(ContextCompat.getColor(this, R.color.danger_red))
            binding.tvGpsStatus.text = "GPS perangkat nonaktif. Aktifkan Lokasi di HP."
            return
        }

        val loc = currentLocation
        if (loc == null) {
            binding.cardGpsStatus.setBackgroundResource(R.drawable.bg_card_lavender_24)
            binding.tvGpsStatus.setTextColor(ContextCompat.getColor(this, R.color.brand_blue))
            binding.tvGpsStatus.text = "Mencari koordinat GPS akurat..."
            return
        }

        if (isMockLocation(loc)) {
            binding.cardGpsStatus.setBackgroundResource(R.drawable.bg_pill_red)
            binding.tvGpsStatus.setTextColor(ContextCompat.getColor(this, R.color.danger_red))
            binding.tvGpsStatus.text = "Fake GPS terdeteksi! Nonaktifkan lokasi palsu."
            return
        }

        val distMeters = distanceToSchoolMeters(loc).roundToInt()
        if (distMeters <= schoolRadiusMeters) {
            binding.cardGpsStatus.setBackgroundResource(R.drawable.bg_pill_green)
            binding.tvGpsStatus.setTextColor(ContextCompat.getColor(this, R.color.badge_green_text))
            binding.tvGpsStatus.text = "Di dalam kawasan sekolah ($distMeters m / maks ${schoolRadiusMeters.toInt()} m)"
        } else {
            binding.cardGpsStatus.setBackgroundResource(R.drawable.bg_pill_red)
            binding.tvGpsStatus.setTextColor(ContextCompat.getColor(this, R.color.danger_red))
            binding.tvGpsStatus.text = "Di luar kawasan sekolah ($distMeters m, maks ${schoolRadiusMeters.toInt()} m)"
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.previewView.surfaceProvider)
            }

            val options = BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                .build()
            val scanner = BarcodeScanning.getClient(options)

            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also { analysis ->
                    analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                        processImageProxy(scanner, imageProxy)
                    }
                }

            try {
                cameraProvider.unbindAll()
                camera = cameraProvider.bindToLifecycle(
                    this,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    imageAnalyzer
                )
            } catch (_: Exception) {
                Toast.makeText(this, "Kamera tidak tersedia.", Toast.LENGTH_SHORT).show()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    @OptIn(ExperimentalGetImage::class)
    private fun processImageProxy(
        scanner: com.google.mlkit.vision.barcode.BarcodeScanner,
        imageProxy: ImageProxy
    ) {
        val mediaImage = imageProxy.image
        if (mediaImage != null && !isProcessing) {
            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
            scanner.process(image)
                .addOnSuccessListener { barcodes ->
                    val raw = barcodes.firstOrNull()?.rawValue
                    if (!raw.isNullOrBlank() && !isProcessing) {
                        runOnUiThread {
                            submitQrToken(raw)
                        }
                    }
                }
                .addOnCompleteListener {
                    imageProxy.close()
                }
        } else {
            imageProxy.close()
        }
    }

    private fun submitQrToken(token: String) {
        if (!hasLocationPermission()) {
            requestPermissionsIfNeeded()
            return
        }

        if (!LocationManagerCompat.isLocationEnabled(locationManager)) {
            showErrorDialog("GPS perangkat Anda nonaktif. Aktifkan Lokasi (GPS) untuk presensi di $schoolName.")
            return
        }

        val loc = currentLocation
        if (loc == null) {
            startLocationUpdates()
            showErrorDialog("Koordinat GPS belum terkunci. Tunggu beberapa detik atau ketuk Cek GPS lalu coba lagi.")
            return
        }

        if (isMockLocation(loc)) {
            showErrorDialog("Presensi ditolak! Aplikasi Fake GPS / lokasi palsu terdeteksi.")
            return
        }

        val dist = distanceToSchoolMeters(loc).roundToInt()
        if (dist > schoolRadiusMeters) {
            showErrorDialog(
                "Presensi ditolak! Lokasi Anda berada di luar kawasan $schoolName " +
                    "(jarak $dist meter, batas maksimal ${schoolRadiusMeters.toInt()} meter)."
            )
            return
        }

        isProcessing = true
        binding.progressScan.visibility = View.VISIBLE
        binding.btnSubmitManual.isEnabled = false

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getService(this@ScannerActivity)
                    .scanPresensi(ScanRequest(token, loc.latitude, loc.longitude))

                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    showSuccessDialog(response.body()?.message ?: "Presensi berhasil!", data)
                } else {
                    val err = parseErrorMessage(response.errorBody()?.string())
                        ?: "Kode QR tidak valid, lokasi di luar sekolah, atau presensi hari ini sudah selesai."
                    showErrorDialog(err)
                }
            } catch (e: Exception) {
                showErrorDialog("Gagal menghubungi server: ${e.localizedMessage}")
            } finally {
                binding.progressScan.visibility = View.GONE
                binding.btnSubmitManual.isEnabled = true
            }
        }
    }

    private fun parseErrorMessage(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        return try {
            Gson().fromJson(raw, ApiResponse::class.java)?.message
        } catch (_: Exception) {
            null
        }
    }

    private fun showSuccessDialog(title: String, data: ScanResultData?) {
        val detail = if (data != null) {
            val waktu = if (data.tipeScan == "pulang") data.jamPulang else data.jamDatang
            val jarakLine = data.jarakMeter?.let { "Jarak dari sekolah: $it m\n" } ?: ""
            "Status: ${data.status}\n" +
                "Waktu: $waktu\n" +
                jarakLine +
                "Sisa Poin: ${data.sisaPoin} Poin\n" +
                String.format(Locale.US, "Rating Bintang PKL: %.1f ★\n\n", data.bintang) +
                (data.pesan ?: "")
        } else {
            "Presensi tercatat di server."
        }

        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(detail)
            .setCancelable(false)
            .setPositiveButton("Selesai") { _, _ ->
                setResult(RESULT_OK)
                finish()
            }
            .show()
    }

    private fun showErrorDialog(message: String) {
        isProcessing = true
        AlertDialog.Builder(this)
            .setTitle("Presensi Ditolak")
            .setMessage(message)
            .setCancelable(false)
            .setPositiveButton("Coba Lagi") { _, _ ->
                isProcessing = false
            }
            .setNegativeButton("Tutup") { _, _ ->
                finish()
            }
            .show()
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::locationManager.isInitialized) {
            locationManager.removeUpdates(locationListener)
        }
        cameraExecutor.shutdown()
    }
}
