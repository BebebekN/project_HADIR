<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Presensi extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tanggal',
        'jam_datang',
        'jam_pulang',
        'status',
        'poin_perubahan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'poin_perubahan' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
