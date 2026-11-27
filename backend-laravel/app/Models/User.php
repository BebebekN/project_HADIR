<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Models\Contracts\HasName;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements FilamentUser, HasName
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'nis_nip',
        'email',
        'nama_lengkap',
        'kelas',
        'avatar_path',
        'child_user_id',
        'role',
        'password',
        'poin_kedisiplinan',
        'bintang',
    ];

    /**
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'poin_kedisiplinan' => 'integer',
            'bintang' => 'decimal:1',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            if (empty($user->email) && !empty($user->nis_nip)) {
                $user->email = self::defaultEmailFor((string) $user->nis_nip, (string) ($user->role ?? 'siswa'));
            }
        });

        static::created(function (User $user): void {
            if ($user->role === 'siswa') {
                self::syncParentAccountForStudent($user);
            }
        });
    }

    public static function defaultEmailFor(string $nisNip, string $role = 'siswa'): string
    {
        $clean = strtolower(trim($nisNip));
        $studentDomain = (string) config('hadir.email.student_domain', 'student.smktelkom-pwt.sch.id');
        $staffDomain = (string) config('hadir.email.staff_domain', 'smktelkom-pwt.sch.id');
        $parentDomain = (string) config('hadir.email.parent_domain', 'parent.smktelkom-pwt.sch.id');

        return match ($role) {
            'siswa' => "{$clean}@{$studentDomain}",
            'orang_tua' => "{$clean}@{$parentDomain}",
            'admin' => $clean === 'admin' ? "admin@{$staffDomain}" : "{$clean}@{$staffDomain}",
            default => "{$clean}@{$staffDomain}",
        };
    }

    /**
     * Auto-provision or update parent account using double child NIS (e.g. 541251041541251041).
     */
    public static function syncParentAccountForStudent(User $student): User
    {
        $doubleNis = $student->nis_nip . $student->nis_nip;
        $parentEmail = self::defaultEmailFor($doubleNis, 'orang_tua');
        $existing = self::where('child_user_id', $student->id)
            ->orWhere('nis_nip', $doubleNis)
            ->first();

        if ($existing) {
            $existing->update([
                'nis_nip' => $doubleNis,
                'email' => $existing->email ?: $parentEmail,
                'nama_lengkap' => 'Orang Tua ' . $student->nama_lengkap,
                'kelas' => $student->kelas,
                'role' => 'orang_tua',
                'child_user_id' => $student->id,
            ]);
            return $existing;
        }

        return self::create([
            'nis_nip' => $doubleNis,
            'email' => $parentEmail,
            'nama_lengkap' => 'Orang Tua ' . $student->nama_lengkap,
            'kelas' => $student->kelas,
            'child_user_id' => $student->id,
            'role' => 'orang_tua',
            'password' => Hash::make($doubleNis),
            'poin_kedisiplinan' => 100,
            'bintang' => 5.0,
        ]);
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return $this->role === 'admin';
    }

    public function getFilamentName(): string
    {
        return $this->nama_lengkap ?: $this->nis_nip;
    }

    public function recalculateBintang(): float
    {
        $poin = $this->poin_kedisiplinan;
        if ($poin >= 95) {
            $bintang = 5.0;
        } elseif ($poin >= 85) {
            $bintang = 4.0;
        } elseif ($poin >= 75) {
            $bintang = 3.0;
        } else {
            $bintang = 2.0;
        }

        $this->bintang = $bintang;
        $this->save();

        return $bintang;
    }

    public function presensis(): HasMany
    {
        return $this->hasMany(Presensi::class);
    }

    public function child(): BelongsTo
    {
        return $this->belongsTo(User::class, 'child_user_id');
    }

    /**
     * Resolve student subject: parent accounts monitor their own child's attendance & schedule.
     */
    public function resolvedStudent(): User
    {
        if ($this->role === 'orang_tua' && $this->child) {
            return $this->child;
        }

        return $this;
    }

    /**
     * Resolve full avatar URL against the active request origin.
     */
    public function resolvedAvatarUrl(?string $origin = null): ?string
    {
        if (!$this->avatar_path) {
            return null;
        }

        $cleanPath = ltrim($this->avatar_path, '/');
        if (str_starts_with($cleanPath, 'http://') || str_starts_with($cleanPath, 'https://')) {
            return $cleanPath;
        }

        $base = $origin ? rtrim($origin, '/') : rtrim((string) config('app.url'), '/');

        return $base ? "{$base}/{$cleanPath}" : "/{$cleanPath}";
    }

    /**
     * Build consistent user payload for API responses (/login, /user, /user/photo, /dashboard).
     */
    public function toApiPayload(?string $origin = null): array
    {
        $subject = $this->resolvedStudent();
        $bintang = (float) $subject->bintang;
        $predikat = match (true) {
            $bintang >= 5.0 => 'Sangat Baik (A)',
            $bintang >= 4.0 => 'Baik (B)',
            $bintang >= 3.0 => 'Cukup (C)',
            default => 'Perlu Pembinaan (D)',
        };

        return [
            'id' => $this->id,
            'nis_nip' => $this->nis_nip,
            'email' => $this->email ?: self::defaultEmailFor((string) $this->nis_nip, (string) $this->role),
            'nama_lengkap' => $this->nama_lengkap,
            'kelas' => $subject->kelas,
            'role' => $this->role,
            'avatar_path' => $this->avatar_path,
            'avatar_url' => $this->resolvedAvatarUrl($origin),
            'child_nis' => $this->role === 'orang_tua' ? $subject->nis_nip : null,
            'child_name' => $this->role === 'orang_tua' ? $subject->nama_lengkap : null,
            'poin_kedisiplinan' => $subject->poin_kedisiplinan,
            'bintang' => $bintang,
            'predikat' => $predikat,
        ];
    }
}
