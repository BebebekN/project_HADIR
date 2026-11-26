package com.psas.hadir.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.gson.Gson
import com.psas.hadir.data.api.RetrofitClient
import com.psas.hadir.data.model.ApiResponse
import com.psas.hadir.data.model.LoginRequest
import com.psas.hadir.data.model.LoginData
import com.psas.hadir.databinding.ActivityLoginBinding
import com.psas.hadir.utils.SessionManager
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import retrofit2.Response
import java.io.IOException

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        sessionManager = SessionManager(this)

        if (sessionManager.isLoggedIn()) {
            navigateAfterLogin()
            return
        }

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        updateEndpointLabel()

        binding.btnLogin.setOnClickListener {
            performLogin()
        }

        binding.btnDemoSiswa.setOnClickListener {
            binding.etNisNip.setText("541251041")
            binding.etPassword.setText("siswa123")
            binding.tvError.visibility = View.GONE
        }

        binding.btnDemoGuru.setOnClickListener {
            binding.etNisNip.setText("198804122015032003")
            binding.etPassword.setText("guru123")
            binding.tvError.visibility = View.GONE
        }

        binding.btnDemoOrangTua.setOnClickListener {
            binding.etNisNip.setText("541251041541251041")
            binding.etPassword.setText("541251041541251041")
            binding.tvError.visibility = View.GONE
        }

        binding.btnServerConfig.setOnClickListener {
            showServerConfigDialog()
        }

        binding.tvCurrentEndpoint.setOnClickListener {
            showServerConfigDialog()
        }

        binding.tvError.setOnClickListener {
            showServerConfigDialog()
        }

        binding.tvForgotPassword.setOnClickListener {
            AlertDialog.Builder(this)
                .setTitle("Panduan Akun & Reset Sandi")
                .setMessage(
                    "• Orang Tua: Login memakai Double NIS anak (contoh: 541251041541251041) sebagai ID & Kata Sandi.\n" +
                        "• Siswa/Guru: Hubungi Wali Kelas XI PPLG 4 (Firda Ayu Nirmala, S.Kom) atau Admin SMK Telkom Purwokerto untuk reset kata sandi."
                )
                .setPositiveButton("Mengerti", null)
                .show()
        }
    }

    private fun updateEndpointLabel() {
        binding.tvCurrentEndpoint.text = "API: ${sessionManager.getBaseUrl()} (Ketuk untuk ubah)"
    }

    private fun showServerConfigDialog() {
        ServerConfigDialog.show(this, sessionManager) {
            updateEndpointLabel()
            binding.tvError.visibility = View.GONE
        }
    }

    private fun performLogin() {
        val nisNip = binding.etNisNip.text?.toString()?.trim().orEmpty()
        val password = binding.etPassword.text?.toString()?.trim().orEmpty()

        if (nisNip.isEmpty() || password.isEmpty()) {
            showError("NIS/NIP dan kata sandi wajib diisi.")
            return
        }

        setLoading(true)
        binding.tvError.visibility = View.GONE

        lifecycleScope.launch {
            val previousUrl = sessionManager.getBaseUrl()
            try {
                val response = executeLoginRequest(nisNip, password)
                handleLoginData(response)
            } catch (e: CancellationException) {
                throw e
            } catch (e: IOException) {
                val recovered = tryFallbackEndpoints(nisNip, password, previousUrl)
                if (!recovered) {
                    sessionManager.saveBaseUrl(previousUrl)
                    RetrofitClient.resetClient()
                    showError(
                        "Gagal terhubung ke $previousUrl\n" +
                            "Pastikan HP & PC pada jaringan yang sama + Firewall Windows port 8000 terbuka, atau hubungkan kabel USB ADB (Ketuk pesan ini untuk ganti IP)."
                    )
                }
            } catch (e: Exception) {
                showError("Terjadi kesalahan saat menghubungi server: ${e.message ?: "Coba lagi"}")
            } finally {
                setLoading(false)
            }
        }
    }

    private suspend fun executeLoginRequest(
        nisNip: String,
        password: String
    ): Response<ApiResponse<LoginData>> {
        return RetrofitClient.getService(this).login(LoginRequest(nisNip, password))
    }

    /**
     * Falls back automatically to USB ADB reverse (127.0.0.1:8000) or the current PC LAN IP
     * on physical devices when a cached/firewalled URL cannot be reached.
     */
    private suspend fun tryFallbackEndpoints(
        nisNip: String,
        password: String,
        previousUrl: String
    ): Boolean {
        if (SessionManager.isEmulator()) return false

        val candidates = listOf(
            SessionManager.DEFAULT_USB_BASE_URL,
            SessionManager.DEFAULT_LAN_BASE_URL
        ).distinct().filter { it != previousUrl }

        for (candidate in candidates) {
            sessionManager.saveBaseUrl(candidate)
            RetrofitClient.resetClient()
            try {
                val response = executeLoginRequest(nisNip, password)
                updateEndpointLabel()
                handleLoginData(response)
                return true
            } catch (e: CancellationException) {
                throw e
            } catch (_: IOException) {
                // Keep trying remaining endpoints.
            }
        }
        return false
    }

    private fun handleLoginData(response: Response<ApiResponse<LoginData>>) {
        if (response.isSuccessful && response.body()?.success == true) {
            val data = response.body()?.data
            if (data != null) {
                sessionManager.saveSession(data.token, data.user)
                navigateAfterLogin()
            } else {
                showError("Respons server tidak lengkap.")
            }
        } else {
            val errorMsg = parseErrorMessage(response.errorBody()?.string())
                ?: "NIS/NIP atau kata sandi salah."
            showError(errorMsg)
        }
    }

    private fun parseErrorMessage(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        return try {
            Gson().fromJson(raw, ApiResponse::class.java)?.message
        } catch (e: Exception) {
            null
        }
    }

    private fun navigateAfterLogin() {
        val user = sessionManager.getUser()
        val intent = if (user?.role == "guru" || user?.role == "admin") {
            Intent(this, MonitoringActivity::class.java)
        } else {
            Intent(this, MainActivity::class.java)
        }
        startActivity(intent)
        finish()
    }

    private fun showError(msg: String) {
        binding.tvError.text = msg
        binding.tvError.visibility = View.VISIBLE
    }

    private fun setLoading(loading: Boolean) {
        binding.btnLogin.isEnabled = !loading
        binding.progressLogin.visibility = if (loading) View.VISIBLE else View.GONE
    }
}
