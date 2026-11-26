<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * POST /api/v1/login
     * Login using nis_nip and password
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nis_nip' => 'required|string',
            'password' => 'required|string',
        ], [
            'nis_nip.required' => 'NIS/NIP wajib diisi.',
            'password.required' => 'Password wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('nis_nip', $request->nis_nip)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'NIS/NIP atau password yang Anda masukkan salah.',
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
