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
        Schema::create('daily_qr_tokens', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal')->unique();
            $table->string('token', 64)->unique();
            $table->time('jam_mulai')->default('06:00:00');
            $table->time('jam_selesai')->default('17:00:00');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_qr_tokens');
    }
};
