# HADIR — Sistem Presensi QR, Jadwal Pelajaran & Monitoring Siswa

Portal dan aplikasi mobile absensi siswa **SMK Telkom Purwokerto (Kelas XI PPLG 4 — Wali Kelas: Firda Ayu Nirmala, S.Kom)**.

## Struktur Proyek
- `frontend-web/` — Website React + Vite + Tailwind CSS (termasuk unduhan APK Android & Web App iOS PWA).
- `backend-laravel/` — REST API Laravel 11 + Sanctum + Filament Admin Panel (geofence SMK Telkom Purwokerto, QR harian Admin, login Siswa/Guru/Orang Tua Double NIS, upload foto profil, notifikasi batas waktu absen H-10 menit).
- `mobile-android/` — Aplikasi Android Kotlin (CameraX QR Scanner, GPS geofence, notifikasi pengingat H-10 menit, dan edit foto profil).

## Deploy Frontend ke Vercel
Repositori ini sudah dikonfigurasi melalui `vercel.json` di root untuk langsung mem-build `frontend-web` dan melayani file unduhan `/downloads/HADIR-Android.apk` serta PWA iOS.

> Untuk menghubungkan frontend Vercel ke backend produksi, atur environment variable `VITE_API_URL` pada Vercel Project Settings (misalnya `https://api-anda.example.com/api/v1`).
