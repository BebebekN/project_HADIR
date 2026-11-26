<?php

namespace App\Filament\Pages;

use App\Models\DailyQrToken;
use Carbon\Carbon;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Str;

class DailyQrGenerator extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-qr-code';

    protected static ?string $navigationLabel = 'QR Presensi Harian';

    protected static ?string $title = 'Generate & Tampilkan QR Code Harian';

    protected static ?string $navigationGroup = 'Presensi & Disiplin';

    protected static string $view = 'filament.pages.daily-qr-generator';

    public ?string $qrToken = null;
    public ?string $qrSvg = null;
    public ?string $tanggal = null;
    public ?string $jamMulai = null;
    public ?string $jamSelesai = null;

    public function mount(): void
    {
        $this->loadQrData();
    }

    public function loadQrData(): void
    {
        $today = Carbon::now('Asia/Jakarta')->toDateString();
        $record = DailyQrToken::getOrCreateForToday();

        $this->qrToken = $record->token;
        $this->tanggal = Carbon::parse($record->tanggal)->isoFormat('dddd, D MMMM Y');
        $this->jamMulai = substr($record->jam_mulai, 0, 5);
        $this->jamSelesai = substr($record->jam_selesai, 0, 5);

        // Generate SVG QR Code using chillerlan/php-qrcode
        try {
            $options = new QROptions([
                'outputType' => QRCode::OUTPUT_MARKUP_SVG,
                'version' => 5,
                'eccLevel' => QRCode::ECC_M,
                'addQuietzone' => true,
                'svgUseFill' => true,
            ]);

            $payload = json_encode([
                'app' => 'HADIR-PSAS',
                'token' => $record->token,
                'tanggal' => $record->tanggal,
            ]);

            $this->qrSvg = (new QRCode($options))->render($payload);
        } catch (\Throwable $e) {
            $this->qrSvg = null;
        }
    }

    public function regenerateToken(): void
    {
        $today = Carbon::now('Asia/Jakarta')->toDateString();
        $record = DailyQrToken::where('tanggal', $today)->first();

        $newToken = 'HADIR-' . strtoupper(Str::random(10));
        if ($record) {
            $record->update(['token' => $newToken]);
        } else {
            DailyQrToken::create([
                'tanggal' => $today,
                'token' => $newToken,
                'jam_mulai' => '06:00:00',
                'jam_selesai' => '17:00:00',
            ]);
        }

        $this->loadQrData();

        Notification::make()
            ->title('Token QR Baru Berhasil Dibuat!')
            ->success()
            ->send();
    }
}
