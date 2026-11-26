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
        if (!Schema::hasTable('presensis')) {
            Schema::create('presensis', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->date('tanggal');
                $table->time('jam_datang')->nullable();
                $table->time('jam_pulang')->nullable();
                $table->enum('status', ['Tepat Waktu', 'Terlambat']);
                $table->integer('poin_perubahan')->default(0);
                $table->timestamps();

                $table->unique(['user_id', 'tanggal']);
            });
        } else {
            Schema::table('presensis', function (Blueprint $table) {
                if (!Schema::hasColumn('presensis', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('presensis', 'updated_at')) {
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
        Schema::dropIfExists('presensis');
    }
};
