package com.psas.hadir.ui

import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.view.View
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.gson.Gson
import com.psas.hadir.data.api.RetrofitClient
import com.psas.hadir.data.model.ApiResponse
import com.psas.hadir.data.model.ForgotPasswordRequest
import com.psas.hadir.data.model.LoginRequest
import com.psas.hadir.data.model.LoginData
import com.psas.hadir.data.model.ResetPasswordRequest
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
            binding.etNisNip.setText("541251185@student.smktelkom-pwt.sch.id")
            binding.etPassword.setText("siswa123")
            binding.tvError.visibility = View.GONE
        }

        binding.btnDemoGuru.setOnClickListener {
            binding.etNisNip.setText("198804122015032003@smktelkom-pwt.sch.id")
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
            showForgotPasswordDialog()
        }
    }

    private fun showForgotPasswordDialog() {
        val currentText = binding.etNisNip.text?.toString()?.trim().orEmpty()
        val guessedEmail = when {
            currentText.contains("@") -> currentText
            currentText.matches(Regex("^\\d{6,12}$")) -> "$currentText@student.smktelkom-pwt.sch.id"
            else -> ""
        }

        val emailInput = EditText(this).apply {
            hint = "541251185@student.smktelkom-pwt.sch.id"
            inputType = InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            setText(guessedEmail)
            setPadding(40, 28, 40, 28)
        }

        AlertDialog.Builder(this)
            .setTitle("Reset Kata Sandi via Email Sekolah")
            .setMessage("Masukkan email sekolah (@student.smktelkom-pwt.sch.id). Kode verifikasi 6 digit akan dikirimkan ke email Anda.")
            .setView(emailInput)
            .setNegativeButton("Batal", null)
            .setPositiveButton("Kirim Kode") { _, _ ->
                val targetEmail = emailInput.text.toString().trim()
                if (targetEmail.isEmpty() || !targetEmail.contains("@")) {
                    Toast.makeText(this, "Masukkan email sekolah yang valid.", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                sendForgotPasswordRequest(targetEmail)
            }
            .show()
    }

    private fun sendForgotPasswordRequest(email: String) {
        setLoading(true)
        lifecycleScope.launch {
            try {
                val res = RetrofitClient.getService(this@LoginActivity)
                    .forgotPassword(ForgotPasswordRequest(email))
                if (res.isSuccessful && res.body()?.success == true) {
                    Toast.makeText(
                        this@LoginActivity,
                        res.body()?.message ?: "Kode OTP telah dikirim ke $email",
                        Toast.LENGTH_LONG
                    ).show()
                    showResetCodeDialog(email)
                } else {
                    val err = parseErrorMessage(res.errorBody()?.string())
                        ?: "Gagal mengirim kode reset ke email."
                    AlertDialog.Builder(this@LoginActivity)
                        .setTitle("Reset Kata Sandi")
                        .setMessage(err)
                        .setPositiveButton("Tutup", null)
                        .show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@LoginActivity,
                    "Gagal menghubungi server: ${e.message ?: "Coba lagi"}",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                setLoading(false)
            }
        }
    }

    private fun showResetCodeDialog(email: String) {
        val codeInput = EditText(this).apply {
            hint = "Kode OTP 6 digit dari email"
            inputType = InputType.TYPE_CLASS_NUMBER
            setPadding(40, 24, 40, 24)
        }
        val passInput = EditText(this).apply {
            hint = "Kata sandi baru (minimal 6 karakter)"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            setPadding(40, 24, 40, 24)
        }
        val confirmInput = EditText(this).apply {
            hint = "Konfirmasi kata sandi baru"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            setPadding(40, 24, 40, 24)
        }

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(36, 12, 36, 8)
            addView(codeInput)
            addView(passInput)
            addView(confirmInput)
        }

        AlertDialog.Builder(this)
            .setTitle("Verifikasi Kode Email")
            .setMessage("Masukkan kode 6 digit yang dikirim ke $email dan kata sandi baru Anda.")
            .setView(container)
            .setNegativeButton("Batal", null)
            .setPositiveButton("Simpan Sandi") { _, _ ->
                val code = codeInput.text.toString().trim()
                val newPass = passInput.text.toString()
                val confirmPass = confirmInput.text.toString()
                if (code.length != 6 || newPass.length < 6 || newPass != confirmPass) {
                    Toast.makeText(
                        this,
                        "Pastikan kode 6 digit benar, sandi min. 6 karakter, dan konfirmasi cocok.",
                        Toast.LENGTH_LONG
                    ).show()
                    return@setPositiveButton
                }
                submitResetPassword(email, code, newPass, confirmPass)
            }
            .show()
    }

    private fun submitResetPassword(email: String, code: String, newPass: String, confirmPass: String) {
        setLoading(true)
        lifecycleScope.launch {
            try {
                val res = RetrofitClient.getService(this@LoginActivity)
                    .resetPassword(ResetPasswordRequest(email, code, newPass, confirmPass))
                if (res.isSuccessful && res.body()?.success == true) {
                    binding.etNisNip.setText(email)
                    binding.etPassword.setText("")
                    Toast.makeText(
                        this@LoginActivity,
                        res.body()?.message ?: "Kata sandi berhasil diperbarui!",
                        Toast.LENGTH_LONG
                    ).show()
                } else {
                    val err = parseErrorMessage(res.errorBody()?.string())
                        ?: "Kode OTP salah atau sudah kedaluwarsa."
                    Toast.makeText(this@LoginActivity, err, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@LoginActivity,
                    "Gagal menghubungi server: ${e.message ?: "Coba lagi"}",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                setLoading(false)
            }
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
        return RetrofitClient.getService(this).login(LoginRequest(nisNip, nisNip, password))
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
            SessionManager.DEFAULT_CLOUD_BASE_URL,
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
