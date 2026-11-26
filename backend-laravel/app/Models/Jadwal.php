<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Jadwal extends Model
{
    use HasFactory;

    protected $fillable = [
        'kelas',
        'hari',
        'nama_kegiatan',
        'nama_guru',
        'jam_mulai',
        'jam_selesai',
    ];
}
