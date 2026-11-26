<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['siswa'::character varying, 'guru'::character varying, 'admin'::character varying, 'orang_tua'::character varying]::text[]))");
        }

        if (!Schema::hasColumn('users', 'child_user_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('child_user_id')
                    ->nullable()
                    ->after('kelas')
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'child_user_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropConstrainedForeignId('child_user_id');
            });
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['siswa'::character varying, 'guru'::character varying, 'admin'::character varying]::text[]))");
        }
    }
};
