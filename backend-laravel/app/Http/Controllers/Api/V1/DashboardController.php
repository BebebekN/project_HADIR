<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Jadwal;
use App\Models\Presensi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    private array $dayMap = [
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu',
        'Sunday' => 'Minggu',
    ];

    /**
     * GET /api/v1/dashboard
     * Data dashboard for Siswa (User Profile, Points, Stars, Today's Attendance, Schedule Carousel)
     */
    public function siswaDashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $subject = $user->resolvedStudent();
        $now = Carbon::now('Asia/Jakarta');
        $today = $now->toDateString();
        $hariIni = $this->dayMap[$now->format('l')] ?? 'Senin';
        $currentTime = $now->format('H:i:s');
        $isWeekend = in_array($hariIni, ['Sabtu', 'Minggu']);

        // 1. Presensi hari ini (milik siswa atau anak dari orang tua)
        $presensiHariIni = Presensi::where('user_id', $subject->id)
            ->where('tanggal', $today)
            ->first();

        // 2. Statistik kehadiran siswa
        $totalHadir = Presensi::where('user_id', $subject->id)->count();
        $totalTepatWaktu = Presensi::where('user_id', $subject->id)->where('status', 'Tepat Waktu')->count();
        $totalTerlambat = Presensi::where('user_id', $subject->id)->where('status', 'Terlambat')->count();

        // 3. Predikat bintang
        $bintang = (float) $subject->bintang;
        $predikat = match (true) {
            $bintang >= 5.0 => 'Sangat Baik (A)',
            $bintang >= 4.0 => 'Baik (B)',
            $bintang >= 3.0 => 'Cukup (C)',
            default => 'Perlu Pembinaan (D)',
        };

        // 4. Jadwal hari ini untuk carousel
        $jadwalHariIni = [];
        if (!$isWeekend && $subject->kelas) {
            $rawJadwal = Jadwal::where('kelas', $subject->kelas)
                ->where('hari', $hariIni)
                ->orderBy('jam_mulai', 'asc')
                ->get();

            $jadwalHariIni = $rawJadwal->map(function ($item) use ($currentTime) {
                $statusWaktu = 'upcoming';
                $centangHijau = false;

                if ($currentTime >= $item->jam_selesai) {
                    $statusWaktu = 'completed';
                    $centangHijau = true;
                } elseif ($currentTime >= $item->jam_mulai && $currentTime < $item->jam_selesai) {
                    $statusWaktu = 'ongoing';
                    $centangHijau = false;
                }

                return [
                    'id' => $item->id,
                    'nama_kegiatan' => $item->nama_kegiatan,
                    'nama_guru' => $item->nama_guru,
                    'jam_mulai' => substr($item->jam_mulai, 0, 5),
                    'jam_selesai' => substr($item->jam_selesai, 0, 5),
                    'durasi' => substr($item->jam_mulai, 0, 5) . ' - ' . substr($item->jam_selesai, 0, 5),
                    'status_waktu' => $statusWaktu,
                    'centang_hijau' => $centangHijau,
                ];
            });
        }

        return response()->json([
            'success' => true,
            'message' => 'Dashboard berhasil dimuat.',
            'data' => [
                'user' => $user->toApiPayload($request->getSchemeAndHttpHost()),
                'presensi_hari_ini' => [
                    'sudah_presensi' => $presensiHariIni !== null,
                    'tanggal' => Carbon::parse($today)->isoFormat('dddd, D MMMM Y'),
                    'jam_datang' => $presensiHariIni?->jam_datang ? substr($presensiHariIni->jam_datang, 0, 5) . ' WIB' : null,
                    'jam_pulang' => $presensiHariIni?->jam_pulang ? substr($presensiHariIni->jam_pulang, 0, 5) . ' WIB' : null,
                    'status' => $presensiHariIni?->status ?? 'Belum Presensi',
                    'poin_perubahan' => $presensiHariIni?->poin_perubahan ?? 0,
                ],
                'statistik_kehadiran' => [
                    'total_kehadiran' => $totalHadir,
                    'tepat_waktu' => $totalTepatWaktu,
                    'terlambat' => $totalTerlambat,
                    'persentase_kedisiplinan' => $totalHadir > 0 
                        ? round(($totalTepatWaktu / $totalHadir) * 100) . '%' 
                        : '100%',
                ],
                'jadwal_hari_ini' => [
                    'hari' => $hariIni,
                    'is_weekend' => $isWeekend,
                    'pesan_libur' => $isWeekend ? 'Akhir Pekan Libur. Waktu yang tepat untuk istirahat!' : null,
                    'items' => $jadwalHariIni,
                ],
                'info_pkl' => [
                    'judul' => 'Sistem Rapor Bintang PKL',
                    'deskripsi' => 'Setiap siswa memulai dengan 100 poin (5.0 ★). Keterlambatan scan lewat pukul 07:00 WIB otomatis mengurangi -5 poin dan mempengaruhi predikat rapor PKL akhir.',
                ],
                'notifikasi_presensi' => $this->buildAttendanceNotification($user, $subject, $presensiHariIni, $isWeekend, $now),
            ],
        ], 200);
    }

    /**
     * Build attendance deadline reminder notification payload (active H-10 minutes before check-in deadline).
     */
    private function buildAttendanceNotification(
        User $user,
        User $subject,
        ?Presensi $presensiHariIni,
        bool $isWeekend,
        Carbon $now
    ): array {
        $deadline = config('hadir.attendance.check_in_deadline', '07:00');
        $warningMinutes = (int) config('hadir.attendance.warning_minutes_before', 10);

        if ($presensiHariIni !== null) {
            return [
                'tampilkan' => false,
                'sudah_presensi' => true,
                'batas_waktu' => "{$deadline} WIB",
                'warning_minutes_before' => $warningMinutes,
                'sisa_menit' => 0,
                'urgensi' => 'done',
                'badge' => 'Sudah Absen',
                'judul' => 'Presensi Hari Ini Tercatat',
                'pesan' => 'Presensi datang tercatat pukul ' . substr((string) $presensiHariIni->jam_datang, 0, 5) . ' WIB.',
            ];
        }

        if ($isWeekend) {
            return [
                'tampilkan' => false,
                'sudah_presensi' => false,
                'batas_waktu' => "{$deadline} WIB",
                'warning_minutes_before' => $warningMinutes,
                'sisa_menit' => 0,
                'urgensi' => 'info',
                'badge' => 'Libur',
                'judul' => 'Akhir Pekan Libur',
                'pesan' => 'Tidak ada jadwal presensi pada akhir pekan.',
            ];
        }

        $deadlineAt = Carbon::createFromFormat('Y-m-d H:i', $now->toDateString() . ' ' . $deadline, 'Asia/Jakarta');
        $minutesLeft = (int) ceil(($deadlineAt->timestamp - $now->timestamp) / 60);
        $isOrangTua = $user->role === 'orang_tua';

        if ($minutesLeft > 0 && $minutesLeft <= $warningMinutes) {
            $judul = $isOrangTua
                ? "Peringatan Absen Anak ({$subject->nama_lengkap})"
                : 'Peringatan Batas Waktu Absen!';
            $pesan = $isOrangTua
                ? "Batas waktu absen {$subject->nama_lengkap} tinggal {$minutesLeft} menit lagi ({$deadline} WIB). Pastikan anak segera scan QR di sekolah."
                : "Batas waktu absen tinggal {$minutesLeft} menit lagi (pukul {$deadline} WIB)! Segera lakukan Scan QR di kawasan SMK Telkom Purwokerto agar poin kedisiplinan tetap 100.";
            $badge = "Tinggal {$minutesLeft} Menit";
            $urgensi = 'high';
        } elseif ($minutesLeft <= 0) {
            $judul = $isOrangTua
                ? "Anak Belum Absen ({$subject->nama_lengkap})"
                : 'Segera Lakukan Presensi QR!';
            $pesan = $isOrangTua
                ? "{$subject->nama_lengkap} belum melakukan scan QR datang hari ini (batas tepat waktu {$deadline} WIB, pengingat H-{$warningMinutes} menit)."
                : "Kamu belum melakukan absen hari ini! Batas waktu tepat waktu pukul {$deadline} WIB (pengingat otomatis {$warningMinutes} menit sebelum batas). Segera scan QR sekarang.";
            $badge = 'Belum Absen';
            $urgensi = 'high';
        } else {
            $judul = $isOrangTua
                ? 'Pengingat Presensi Anak'
                : 'Pengingat Batas Waktu Absen';
            $pesan = $isOrangTua
                ? "{$subject->nama_lengkap} belum scan QR datang hari ini. Batas waktu pukul {$deadline} WIB."
                : "Batas waktu absen tepat waktu pukul {$deadline} WIB (tersisa {$minutesLeft} menit). Pengingat otomatis aktif {$warningMinutes} menit sebelum batas.";
            $badge = "H-{$minutesLeft} Menit";
            $urgensi = 'warning';
        }

        return [
            'tampilkan' => true,
            'sudah_presensi' => false,
            'batas_waktu' => "{$deadline} WIB",
            'warning_minutes_before' => $warningMinutes,
            'sisa_menit' => max(0, $minutesLeft),
            'urgensi' => $urgensi,
            'badge' => $badge,
            'judul' => $judul,
            'pesan' => $pesan,
        ];
    }

    /**
     * GET /api/v1/guru/monitoring
     * Attendance recap and PKL star disciplinary report for Guru and Admin
     */
    public function guruMonitoring(Request $request): JsonResponse
    {
        if (!in_array($request->user()->role, ['guru', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya Guru dan Admin yang dapat melihat rekap seluruh kelas.',
            ], 403);
        }

        $selectedKelas = $request->query('kelas', 'XI PPLG 4');
        $selectedTanggal = $request->query('tanggal', Carbon::now('Asia/Jakarta')->toDateString());

        // 1. Get all students in the class
        $students = User::where('role', 'siswa')
            ->where('kelas', $selectedKelas)
            ->with(['presensis' => function ($q) use ($selectedTanggal) {
                $q->where('tanggal', $selectedTanggal);
            }])
            ->withCount([
                'presensis as total_hadir',
                'presensis as total_tepat_waktu' => fn ($q) => $q->where('status', 'Tepat Waktu'),
                'presensis as total_terlambat' => fn ($q) => $q->where('status', 'Terlambat'),
            ])
            ->orderBy('nama_lengkap', 'asc')
            ->get();

        $totalSiswa = $students->count();
        $totalHadirHariIni = 0;
        $tepatWaktuHariIni = 0;
        $terlambatHariIni = 0;
        $totalBintang = 0;

        $studentList = $students->map(function ($student) use (&$totalHadirHariIni, &$tepatWaktuHariIni, &$terlambatHariIni, &$totalBintang) {
            $presensiToday = $student->presensis->first();
            $bintang = (float) $student->bintang;
            $totalBintang += $bintang;

            $statusHariIni = 'Belum Hadir';
            $jamDatang = null;
            $jamPulang = null;

            if ($presensiToday) {
                $totalHadirHariIni++;
                $statusHariIni = $presensiToday->status;
                $jamDatang = $presensiToday->jam_datang ? substr($presensiToday->jam_datang, 0, 5) . ' WIB' : null;
                $jamPulang = $presensiToday->jam_pulang ? substr($presensiToday->jam_pulang, 0, 5) . ' WIB' : null;

                if ($presensiToday->status === 'Tepat Waktu') {
                    $tepatWaktuHariIni++;
                } else {
                    $terlambatHariIni++;
                }
            }

            $predikat = match (true) {
                $bintang >= 5.0 => 'Sangat Baik (A)',
                $bintang >= 4.0 => 'Baik (B)',
                $bintang >= 3.0 => 'Cukup (C)',
                default => 'Kurang / Pembinaan (D)',
            };

            return [
                'user_id' => $student->id,
                'nis' => $student->nis_nip,
                'nama_lengkap' => $student->nama_lengkap,
                'kelas' => $student->kelas,
                'status_hari_ini' => $statusHariIni,
                'jam_datang' => $jamDatang,
                'jam_pulang' => $jamPulang,
                'total_kehadiran' => $student->total_hadir,
                'total_tepat_waktu' => $student->total_tepat_waktu,
                'total_terlambat' => $student->total_terlambat,
                'poin_kedisiplinan' => $student->poin_kedisiplinan,
                'bintang' => $bintang,
                'predikat' => $predikat,
            ];
        });

        $belumHadirHariIni = max(0, $totalSiswa - $totalHadirHariIni);
        $rataRataBintang = $totalSiswa > 0 ? round($totalBintang / $totalSiswa, 1) : 5.0;

        return response()->json([
            'success' => true,
            'message' => 'Data monitoring presensi & rapor PKL berhasil diambil.',
            'data' => [
                'kelas' => $selectedKelas,
                'tanggal' => $selectedTanggal,
                'ringkasan' => [
                    'total_siswa' => $totalSiswa,
                    'hadir_hari_ini' => $totalHadirHariIni,
                    'tepat_waktu' => $tepatWaktuHariIni,
                    'terlambat' => $terlambatHariIni,
                    'belum_hadir' => $belumHadirHariIni,
                    'rata_rata_bintang' => $rataRataBintang,
                ],
                'siswa' => $studentList,
            ],
        ], 200);
    }
}
