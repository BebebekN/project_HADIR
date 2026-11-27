<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * POST /api/v1/login
     * Login using school email (or NIS/NIP / Double NIS fallback) and password
     */
    public function login(Request $request): JsonResponse
    {
        $identifier = trim((string) (
            $request->input('email')
            ?: $request->input('login')
            ?: $request->input('nis_nip', '')
        ));

        $validator = Validator::make([
            'identifier' => $identifier,
            'password' => $request->input('password'),
        ], [
            'identifier' => 'required|string',
            'password' => 'required|string',
        ], [
            'identifier.required' => 'Email sekolah atau NIS/NIP wajib diisi.',
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $lowerIdentifier = strtolower($identifier);
        $user = User::whereRaw('LOWER(email) = ?', [$lowerIdentifier])
            ->orWhere('nis_nip', $identifier)
            ->first();

        if (!$user || !Hash::check((string) $request->input('password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email sekolah / NIS/NIP atau kata sandi yang Anda masukkan salah.',
            ], 401);
        }

        // Create Sanctum Token
        $tokenName = 'auth_token_' . ($user->role ?? 'user');
        $token = $user->createToken($tokenName)->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => $user->toApiPayload($request->getSchemeAndHttpHost()),
            ],
        ], 200);
    }

    /**
     * POST /api/v1/forgot-password
     * Send 6-digit password reset code to user's school email.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ], [
            'email.required' => 'Email sekolah wajib diisi.',
            'email.email' => 'Format email sekolah tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first() ?: 'Format email tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim((string) $request->input('email')));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Email sekolah tersebut tidak terdaftar di sistem HADIR.',
            ], 404);
        }

        $resendApiKey = trim((string) env('RESEND_API_KEY', ''));
        $mailer = (string) config('mail.default', 'log');
        $hasSmtpOrMailDriver = !in_array($mailer, ['log', 'array'], true);

        if ($resendApiKey === '' && !$hasSmtpOrMailDriver) {
            return response()->json([
                'success' => false,
                'message' => 'Layanan pengiriman email reset kata sandi belum dikonfigurasi pada server. Hubungi Admin Sekolah untuk mengatur RESEND_API_KEY atau SMTP.',
            ], 503);
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $hashedCode = Hash::make($code);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            ['token' => $hashedCode, 'created_at' => Carbon::now()]
        );

        $subject = '[HADIR SMK Telkom] Kode Reset Kata Sandi Anda';
        $body = "Halo {$user->nama_lengkap},\n\n"
            . "Anda mengajukan permintaan reset kata sandi untuk akun HADIR ({$user->nis_nip}).\n"
            . "Kode verifikasi 6-digit Anda adalah:\n\n"
            . "    {$code}\n\n"
            . "Kode ini berlaku selama 15 menit. Jangan bagikan kode ini kepada siapa pun.\n\n"
            . "Salam,\nTim HADIR SMK Telkom Purwokerto";

        try {
            if ($resendApiKey !== '') {
                $fromAddress = (string) env('RESEND_FROM_EMAIL', env('MAIL_FROM_ADDRESS', 'HADIR SMK Telkom <onboarding@resend.dev>'));
                $res = Http::withToken($resendApiKey)->timeout(10)->post('https://api.resend.com/emails', [
                    'from' => $fromAddress,
                    'to' => [$email],
                    'subject' => $subject,
                    'text' => $body,
                ]);
                if (!$res->successful()) {
                    throw new \RuntimeException('Email provider rejected request: ' . $res->status());
                }
            } else {
                Mail::raw($body, function ($message) use ($email, $subject): void {
                    $message->to($email)->subject($subject);
                });
            }
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim email verifikasi. Periksa konfigurasi email server atau coba lagi beberapa saat.',
            ], 502);
        }

        return response()->json([
            'success' => true,
            'message' => "Kode reset kata sandi (6 digit) telah dikirim ke {$email}. Berlaku selama 15 menit.",
        ], 200);
    }

    /**
     * POST /api/v1/reset-password
     * Verify 6-digit email code and update user's password.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed',
        ], [
            'email.required' => 'Email sekolah wajib diisi.',
            'email.email' => 'Format email sekolah tidak valid.',
            'code.required' => 'Kode OTP 6 digit wajib diisi.',
            'code.size' => 'Kode OTP harus terdiri dari 6 digit angka.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.min' => 'Kata sandi baru minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first() ?: 'Validasi reset kata sandi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim((string) $request->input('email')));
        $row = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (!$row || empty($row->created_at) || Carbon::parse($row->created_at)->addMinutes(15)->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Kode verifikasi tidak ditemukan atau sudah kedaluwarsa (lebih dari 15 menit).',
            ], 422);
        }

        if (!Hash::check(trim((string) $request->input('code')), (string) $row->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Kode verifikasi 6 digit tidak sesuai.',
            ], 422);
        }

        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Akun pengguna tidak ditemukan.',
            ], 404);
        }

        $user->password = Hash::make((string) $request->input('password'));
        $user->save();

        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.',
        ], 200);
    }

    /**
     * POST /api/v1/logout
     * Revoke active token
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil. Sesi telah diakhiri.',
        ], 200);
    }

    /**
     * GET /api/v1/user
     * Get profile of authenticated user
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'message' => 'Data profil berhasil diambil.',
            'data' => $user->toApiPayload($request->getSchemeAndHttpHost()),
        ], 200);
    }

    /**
     * POST /api/v1/user/photo
     * Upload or replace profile photo for the authenticated user.
     */
    public function updatePhoto(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
        ], [
            'photo.required' => 'Pilih file foto terlebih dahulu.',
            'photo.image' => 'File yang diunggah harus berupa gambar.',
            'photo.mimes' => 'Format foto harus JPG, PNG, atau WEBP.',
            'photo.max' => 'Ukuran foto maksimal 5 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first() ?: 'Validasi foto gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $file = $request->file('photo');
        $directory = public_path('uploads/avatars');
        File::ensureDirectoryExists($directory);

        $this->removeAvatarFileIfExists($user->avatar_path);

        $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $filename = sprintf('avatar_%d_%d.%s', $user->id, time(), $ext);
        $file->move($directory, $filename);

        $user->avatar_path = "uploads/avatars/{$filename}";
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil diperbarui.',
            'data' => $user->toApiPayload($request->getSchemeAndHttpHost()),
        ], 200);
    }

    /**
     * DELETE /api/v1/user/photo
     * Reset profile photo back to monogram initials.
     */
    public function deletePhoto(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->removeAvatarFileIfExists($user->avatar_path);

        $user->avatar_path = null;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Foto profil dihapus dan dikembalikan ke inisial.',
            'data' => $user->toApiPayload($request->getSchemeAndHttpHost()),
        ], 200);
    }

    private function removeAvatarFileIfExists(?string $avatarPath): void
    {
        if (!$avatarPath) {
            return;
        }
        $fullPath = public_path(ltrim($avatarPath, '/'));
        if (File::exists($fullPath)) {
            File::delete($fullPath);
        }
    }
}
