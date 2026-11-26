<?php

namespace App\Filament\Widgets;

use App\Models\DailyQrToken;
use App\Models\Presensi;
use App\Models\User;
use Carbon\Carbon;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class PsasStatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $today = Carbon::today()->toDateString();

        $totalSiswa = User::where('role', 'siswa')->count();
        $totalGuru = User::where('role', 'guru')->count();

        $hadirToday = Presensi::whereDate('tanggal', $today)->count();
        $tepatWaktuToday = Presensi::whereDate('tanggal', $today)->where('status', 'Tepat Waktu')->count();
        $terlambatToday = Presensi::whereDate('tanggal', $today)->where('status', 'Terlambat')->count();

        $avgBintang = User::where('role', 'siswa')->avg('bintang') ?? 5.0;
        $avgPoin = round(User::where('role', 'siswa')->avg('poin_kedisiplinan') ?? 100);

        $qrToday = DailyQrToken::getOrCreateForToday();

        return [
            Stat::make('Total Siswa PKL', (string) $totalSiswa)
                ->description("Didampingi oleh {$totalGuru} Guru Pembimbing")
                ->descriptionIcon('heroicon-m-academic-cap')
                ->color('info'),

            Stat::make('Kehadiran Hari Ini', "{$hadirToday} / {$totalSiswa}")
                ->description("{$tepatWaktuToday} Tepat Waktu • {$terlambatToday} Terlambat")
                ->descriptionIcon('heroicon-m-check-badge')
                ->color($terlambatToday > 0 ? 'warning' : 'success'),

            Stat::make('Rata-Rata Bintang PKL', number_format((float) $avgBintang, 1) . ' ★')
                ->description("Rata-rata {$avgPoin} / 100 Poin Kedisiplinan")
                ->descriptionIcon('heroicon-m-star')
                ->color('warning'),

            Stat::make('Token QR Hari Ini', $qrToday->token)
                ->description('Aktif ' . substr($qrToday->jam_mulai, 0, 5) . ' - ' . substr($qrToday->jam_selesai, 0, 5) . ' WIB')
                ->descriptionIcon('heroicon-m-qr-code')
                ->color('success'),
        ];
    }
}
