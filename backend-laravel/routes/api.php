<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\JadwalController;
use App\Http\Controllers\Api\V1\PresensiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Project-PSAS V1
|--------------------------------------------------------------------------
| Seluruh endpoint REST API di bawah prefix /api/v1/
*/

Route::prefix('v1')->group(function () {
    // 1. Authentication (Public)
    Route::post('/login', [AuthController::class, 'login']);

    // 2. Protected Routes (Laravel Sanctum Bearer Token)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth session & profile photo
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'me']);
        Route::post('/user/photo', [AuthController::class, 'updatePhoto']);
        Route::delete('/user/photo', [AuthController::class, 'deletePhoto']);

        // Presensi QR & Scoring
        Route::post('/presensi/scan', [PresensiController::class, 'scan']);
        Route::get('/presensi/today', [PresensiController::class, 'today']);

        // Jadwal Real-Time
        Route::get('/jadwal', [JadwalController::class, 'index']);

        // Dashboard & Monitoring
        Route::get('/dashboard', [DashboardController::class, 'siswaDashboard']);
        Route::get('/guru/monitoring', [DashboardController::class, 'guruMonitoring']);
    });
});
