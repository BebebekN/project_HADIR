<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('jadwals')) {
            Schema::create('jadwals', function (Blueprint $table) {
                $table->id();
                $table->string('kelas', 30);
                $table->enum('hari', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
                $table->string('nama_kegiatan', 150);
                $table->string('nama_guru', 150);
                $table->time('jam_mulai');
                $table->time('jam_selesai');
                $table->timestamps();
            });
        } else {
            Schema::table('jadwals', function (Blueprint $table) {
                if (!Schema::hasColumn('jadwals', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('jadwals', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jadwals');
    }
};
