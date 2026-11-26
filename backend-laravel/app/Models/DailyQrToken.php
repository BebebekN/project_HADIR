<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DailyQrToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'tanggal',
        'token',
        'jam_mulai',
        'jam_selesai',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }

    /**
     * Get or create active Admin QR token for today (WIB)
     */
    public static function getOrCreateForToday(): self
    {
        $today = now('Asia/Jakarta')->toDateString();

        return self::firstOrCreate(
            ['tanggal' => $today],
            [
                'token' => 'HADIR-' . strtoupper(Str::random(10)),
                'jam_mulai' => '06:00:00',
                'jam_selesai' => '17:00:00',
            ]
        );
    }
}
