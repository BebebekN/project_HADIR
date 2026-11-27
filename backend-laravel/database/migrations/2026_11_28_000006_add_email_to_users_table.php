<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'email')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('email', 191)->nullable()->unique()->after('nis_nip');
            });
        }

        if (!Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }

        $users = DB::table('users')
            ->whereNull('email')
            ->orWhere('email', '')
            ->orderBy('id')
            ->get(['id', 'nis_nip', 'role']);

        foreach ($users as $user) {
            $nisNip = trim((string) $user->nis_nip);
            $email = match ($user->role) {
                'siswa' => strtolower($nisNip) . '@student.smktelkom-pwt.sch.id',
                'guru' => strtolower($nisNip) . '@smktelkom-pwt.sch.id',
                'admin' => strtolower($nisNip) === 'admin'
                    ? 'admin@smktelkom-pwt.sch.id'
                    : strtolower($nisNip) . '@smktelkom-pwt.sch.id',
                'orang_tua' => strtolower($nisNip) . '@parent.smktelkom-pwt.sch.id',
                default => strtolower($nisNip) . '@smktelkom-pwt.sch.id',
            };

            $exists = DB::table('users')
                ->where('email', $email)
                ->where('id', '!=', $user->id)
                ->exists();

            if (!$exists) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['email' => $email]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'email')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique(['email']);
                $table->dropColumn('email');
            });
        }
    }
};
