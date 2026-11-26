<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Jadwal;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JadwalController extends Controller
{
    /**
     * Map English day names to Indonesian
     */
    private array $dayMap = [
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu',
        'Sunday' => 'Minggu',
    ];

    private array $dayIndex = [
        'Senin' => 1,
        'Selasa' => 2,
        'Rabu' => 3,
        'Kamis' => 4,
        'Jumat' => 5,
        'Sabtu' => 6,
        'Minggu' => 7,
    ];

    /**
     * GET /api/v1/jadwal
     * Return schedule Monday - Friday with real-time completion status and weekend holiday flag
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $subject = $user->resolvedStudent();
        $targetKelas = $request->query('kelas', $subject->kelas ?? 'XI PPLG 4');

        $now = Carbon::now('Asia/Jakarta');
        $englishDay = $now->format('l');
        $hariIni = $this->dayMap[$englishDay] ?? 'Senin';
        $currentTime = $now->format('H:i:s');

        $isWeekend = in_array($hariIni, ['Sabtu', 'Minggu']);
        $todayIndex = $this->dayIndex[$hariIni] ?? 1;

        // Fetch schedules for the class
        $jadwals = Jadwal::where('kelas', $targetKelas)
            ->orderByRaw("CASE 
                WHEN hari = 'Senin' THEN 1 
                WHEN hari = 'Selasa' THEN 2 
                WHEN hari = 'Rabu' THEN 3 
                WHEN hari = 'Kamis' THEN 4 
                WHEN hari = 'Jumat' THEN 5 
                ELSE 6 END")
            ->orderBy('jam_mulai', 'asc')
            ->get();

        // Process real-time status for each item
        $processed = $jadwals->map(function ($item) use ($hariIni, $todayIndex, $currentTime, $isWeekend) {
            $itemDayIndex = $this->dayIndex[$item->hari] ?? 1;
            $isSameDay = ($item->hari === $hariIni);

            $statusWaktu = 'upcoming'; // upcoming, ongoing, completed
            $centangHijau = false;

            if ($isWeekend) {
                $statusWaktu = 'libur';
                $centangHijau = false;
            } else {
                if ($itemDayIndex < $todayIndex) {
                    // Day has completely passed earlier this week
                    $statusWaktu = 'completed';
                    $centangHijau = true;
                } elseif ($isSameDay) {
                    if ($currentTime >= $item->jam_selesai) {
                        $statusWaktu = 'completed';
                        $centangHijau = true;
                    } elseif ($currentTime >= $item->jam_mulai && $currentTime < $item->jam_selesai) {
                        $statusWaktu = 'ongoing';
                        $centangHijau = false;
                    } else {
                        $statusWaktu = 'upcoming';
                        $centangHijau = false;
                    }
                } else {
                    // Future day this week
                    $statusWaktu = 'upcoming';
                    $centangHijau = false;
                }
            }

            return [
                'id' => $item->id,
                'kelas' => $item->kelas,
                'hari' => $item->hari,
                'nama_kegiatan' => $item->nama_kegiatan,
                'nama_guru' => $item->nama_guru,
                'jam_mulai' => substr($item->jam_mulai, 0, 5),
                'jam_selesai' => substr($item->jam_selesai, 0, 5),
                'durasi' => substr($item->jam_mulai, 0, 5) . ' - ' . substr($item->jam_selesai, 0, 5),
                'is_hari_ini' => $isSameDay,
                'status_waktu' => $statusWaktu, // 'completed', 'ongoing', 'upcoming', 'libur'
                'centang_hijau' => $centangHijau,
            ];
        });

        // Filter carousel items for today
        $carouselHariIni = $processed->where('is_hari_ini', true)->values();

        // Group by day for the full timetable view
        $grouped = [
            'Senin' => $processed->where('hari', 'Senin')->values(),
            'Selasa' => $processed->where('hari', 'Selasa')->values(),
            'Rabu' => $processed->where('hari', 'Rabu')->values(),
            'Kamis' => $processed->where('hari', 'Kamis')->values(),
            'Jumat' => $processed->where('hari', 'Jumat')->values(),
        ];

        return response()->json([
            'success' => true,
            'message' => $isWeekend 
                ? 'Hari ini adalah Libur Akhir Pekan (Sabtu/Minggu).'
                : 'Jadwal pelajaran hari ' . $hariIni . ' berhasil diambil.',
            'data' => [
                'kelas' => $targetKelas,
                'hari_ini' => $hariIni,
                'jam_sekarang' => substr($currentTime, 0, 5) . ' WIB',
                'is_weekend' => $isWeekend,
                'libur_akhir_pekan' => $isWeekend,
                'pesan_libur' => $isWeekend ? 'Libur Akhir Pekan. Selamat beristirahat dan mengisi energi kembali!' : null,
                'carousel_hari_ini' => $isWeekend ? [] : $carouselHariIni,
                'jadwal_mingguan' => $grouped,
            ],
        ], 200);
    }
}
