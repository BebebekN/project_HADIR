<?php

namespace App\Filament\Pages;

use App\Models\DailyQrToken;
use App\Models\Jadwal;
use Carbon\Carbon;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Filament\Notifications\Notification;
use Filament\Pages\Page;

class DailyQrGenerator extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-qr-code';

    protected static ?string $navigationLabel = 'QR Presensi Harian';

    protected static ?string $title = 'Generate & Tampilkan QR Code Harian';

    protected static ?string $navigationGroup = 'Presensi & Disiplin';

    protected static string $view = 'filament.pages.daily-qr-generator';

    public ?string $qrToken = null;
    public ?string $tokenDatang = null;
    public ?string $tokenPulang = null;
    public ?string $qrSvg = null;
    public ?string $qrSvgDatang = null;
    public ?string $qrSvgPulang = null;
    public ?string $tanggal = null;
    public ?string $jamMulai = null;
    public ?string $jamSelesai = null;
    public ?string $kbmSelesai = null;

    public function mount(): void
    {
        $this->loadQrData();
    }

    public function loadQrData(): void
    {
        $now = Carbon::now('Asia/Jakarta');
        $today = $now->toDateString();
        $record = DailyQrToken::getOrCreateForToday();

        $this->tokenDatang = $record->token_datang ?: $record->token;
        $this->tokenPulang = $record->token_pulang;
        $this->qrToken = $this->tokenDatang;
        $this->tanggal = Carbon::parse($record->tanggal)->isoFormat('dddd, D MMMM Y');
        $this->jamMulai = substr($record->jam_mulai, 0, 5);
        $this->jamSelesai = substr($record->jam_selesai, 0, 5);

        $dayMap = [
            'Monday' => 'Senin',
            'Tuesday' => 'Selasa',
            'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis',
            'Friday' => 'Jumat',
            'Saturday' => 'Sabtu',
            'Sunday' => 'Minggu',
        ];
        $hariIni = $dayMap[$now->format('l')] ?? 'Senin';
        $maxJamSelesai = Jadwal::where('hari', $hariIni)->max('jam_selesai');
        $defaultEnd = (string) config('hadir.attendance.default_kbm_end', '15:30');
        $this->kbmSelesai = $maxJamSelesai ? substr((string) $maxJamSelesai, 0, 5) : substr($defaultEnd, 0, 5);

        $this->qrSvgDatang = $this->buildQrSvg('datang', (string) $this->tokenDatang, $today);
        $this->qrSvgPulang = $this->buildQrSvg('pulang', (string) $this->tokenPulang, $today);
        $this->qrSvg = $this->qrSvgDatang;
    }

    private function buildQrSvg(string $type, string $token, string $tanggal): ?string
    {
        if ($token === '') {
            return null;
        }

        try {
            $options = new QROptions([
                'outputType' => QRCode::OUTPUT_MARKUP_SVG,
                'version' => QRCode::VERSION_AUTO,
                'eccLevel' => QRCode::ECC_M,
                'addQuietzone' => true,
                'svgUseFill' => true,
            ]);

            $payload = json_encode([
                'app' => 'HADIR-PSAS',
                'type' => $type,
                'token' => $token,
                'tanggal' => $tanggal,
            ], JSON_UNESCAPED_SLASHES);

            return (new QRCode($options))->render($payload);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function regenerateToken(): void
    {
        DailyQrToken::regenerateForToday();
        $this->loadQrData();

        Notification::make()
            ->title('Pasangan QR Datang & Pulang Baru Berhasil Dibuat!')
            ->success()
            ->send();
    }
}
