<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('daily_qr_tokens', 'token_datang')) {
            Schema::table('daily_qr_tokens', function (Blueprint $table) {
                $table->string('token_datang', 64)->nullable()->unique()->after('token');
            });
        }

        if (!Schema::hasColumn('daily_qr_tokens', 'token_pulang')) {
            Schema::table('daily_qr_tokens', function (Blueprint $table) {
                $table->string('token_pulang', 64)->nullable()->unique()->after('token_datang');
            });
        }

        $rows = DB::table('daily_qr_tokens')->orderBy('id')->get(['id', 'token', 'token_datang', 'token_pulang']);

        foreach ($rows as $row) {
            $updates = [];

            if (empty($row->token_datang)) {
                $datang = !empty($row->token)
                    ? $row->token
                    : 'HADIR-DTG-' . strtoupper(substr(bin2hex(random_bytes(5)), 0, 8));
                $updates['token_datang'] = $datang;
            }

            if (empty($row->token_pulang)) {
                $updates['token_pulang'] = 'HADIR-PLG-' . strtoupper(substr(bin2hex(random_bytes(5)), 0, 8));
            }

            if (!empty($updates)) {
                DB::table('daily_qr_tokens')
                    ->where('id', $row->id)
                    ->update($updates);
            }
        }
    }

    public function down(): void
    {
        Schema::table('daily_qr_tokens', function (Blueprint $table) {
            if (Schema::hasColumn('daily_qr_tokens', 'token_pulang')) {
                $table->dropUnique(['token_pulang']);
                $table->dropColumn('token_pulang');
            }
            if (Schema::hasColumn('daily_qr_tokens', 'token_datang')) {
                $table->dropUnique(['token_datang']);
                $table->dropColumn('token_datang');
            }
        });
    }
};
