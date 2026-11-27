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
        'token_datang',
        'token_pulang',
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
     * Generate a fresh pair of daily QR tokens (Datang & Pulang).
     */
    public static function generateTokenPair(): array
    {
        return [
            'token_datang' => 'HADIR-DTG-' . strtoupper(Str::random(8)),
            'token_pulang' => 'HADIR-PLG-' . strtoupper(Str::random(8)),
        ];
    }

    /**
     * Get or create active Admin paired QR tokens for today (WIB)
     */
    public static function getOrCreateForToday(): self
    {
        $today = now('Asia/Jakarta')->toDateString();
        $existing = self::where('tanggal', $today)->first();

        if ($existing) {
            $pair = self::generateTokenPair();
            $dirty = false;

            if (empty($existing->token_datang)) {
                $existing->token_datang = !empty($existing->token)
                    ? $existing->token
                    : $pair['token_datang'];
                $dirty = true;
            }
            if (empty($existing->token_pulang)) {
                $existing->token_pulang = $pair['token_pulang'];
                $dirty = true;
            }
            if (empty($existing->token)) {
                $existing->token = $existing->token_datang;
                $dirty = true;
            }
            if ($dirty) {
                $existing->save();
            }

            return $existing;
        }

        $pair = self::generateTokenPair();

        return self::create([
            'tanggal' => $today,
            'token' => $pair['token_datang'],
            'token_datang' => $pair['token_datang'],
            'token_pulang' => $pair['token_pulang'],
            'jam_mulai' => '06:00:00',
            'jam_selesai' => '17:00:00',
        ]);
    }

    /**
     * Regenerate today's paired Datang and Pulang QR tokens.
     */
    public static function regenerateForToday(): self
    {
        $today = now('Asia/Jakarta')->toDateString();
        $pair = self::generateTokenPair();
        $record = self::where('tanggal', $today)->first();

        if ($record) {
            $record->update([
                'token' => $pair['token_datang'],
                'token_datang' => $pair['token_datang'],
                'token_pulang' => $pair['token_pulang'],
            ]);

            return $record->fresh();
        }

        return self::create([
            'tanggal' => $today,
            'token' => $pair['token_datang'],
            'token_datang' => $pair['token_datang'],
            'token_pulang' => $pair['token_pulang'],
            'jam_mulai' => '06:00:00',
            'jam_selesai' => '17:00:00',
        ]);
    }
}
