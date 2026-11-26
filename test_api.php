<?php

function testEndpoint($method, $url, $headers = [], $body = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    $headerList = ['Accept: application/json'];
    foreach ($headers as $k => $v) {
        $headerList[] = "$k: $v";
    }

    if ($body !== null) {
        $json = json_encode($body);
        $headerList[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
    }

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headerList);
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
        'status' => $status,
        'body' => json_decode($response, true),
        'raw' => $response,
        'error' => $error,
    ];
}

// Fetch today's active Admin-generated QR token directly from PostgreSQL
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=db_psas', 'postgres', '');
$stmt = $pdo->prepare('SELECT token FROM daily_qr_tokens WHERE tanggal = :tanggal ORDER BY id DESC LIMIT 1');
$tz = new DateTimeZone('Asia/Jakarta');
$today = (new DateTime('now', $tz))->format('Y-m-d');
$stmt->execute([':tanggal' => $today]);
$adminQrToken = $stmt->fetchColumn();

$baseUrl = 'http://127.0.0.1:8000/api/v1';

echo "========================================================\n";
echo "   PENGUJIAN ENDPOINT REST API HADIR (GEOFENCE + QR)\n";
echo "========================================================\n";
echo "Admin QR Token Aktif ($today): " . ($adminQrToken ?: 'NONE') . "\n\n";

// 1. Test Login Siswa
echo "[TEST 1] POST /api/v1/login (Siswa: 541251041)\n";
$res1 = testEndpoint('POST', "$baseUrl/login", [], [
    'nis_nip' => '541251041',
    'password' => 'siswa123'
]);
echo "Status: {$res1['status']}\n";
echo "Nama Siswa: " . ($res1['body']['data']['user']['nama_lengkap'] ?? '') . "\n";
$siswaToken = $res1['body']['data']['token'] ?? null;
echo "\n";

// 2. Test Get User Profile
echo "[TEST 2] GET /api/v1/user\n";
$res2 = testEndpoint('GET', "$baseUrl/user", ['Authorization' => "Bearer $siswaToken"]);
echo "Status: {$res2['status']}\n";
echo "Nama: " . ($res2['body']['data']['nama_lengkap'] ?? '') . " | Kelas: " . ($res2['body']['data']['kelas'] ?? '') . "\n\n";

// 3. Test Dashboard Siswa
echo "[TEST 3] GET /api/v1/dashboard\n";
$res3 = testEndpoint('GET', "$baseUrl/dashboard", ['Authorization' => "Bearer $siswaToken"]);
echo "Status: {$res3['status']} | Jadwal Hari Ini: " . count($res3['body']['data']['jadwal_hari_ini']['items'] ?? []) . "\n\n";

// 4. Test Scan QR Tanpa Lokasi GPS (Harus Ditolak 422)
echo "[TEST 4] POST /api/v1/presensi/scan (Tanpa GPS - Expected 422)\n";
$res4 = testEndpoint('POST', "$baseUrl/presensi/scan", ['Authorization' => "Bearer $siswaToken"], [
    'qr_token' => $adminQrToken
]);
echo "Status: {$res4['status']}\n";
echo "Message: " . ($res4['body']['message'] ?? '') . "\n\n";

// 5. Test Scan QR di Luar SMK Telkom Purwokerto (Alun-alun Purwokerto - Expected 403)
echo "[TEST 5] POST /api/v1/presensi/scan (Di Luar Sekolah - Expected 403)\n";
$res5 = testEndpoint('POST', "$baseUrl/presensi/scan", ['Authorization' => "Bearer $siswaToken"], [
    'qr_token' => $adminQrToken,
    'latitude' => -7.4200,
    'longitude' => 109.2300,
]);
echo "Status: {$res5['status']}\n";
echo "Message: " . ($res5['body']['message'] ?? '') . "\n\n";

// 6. Test Scan Token Demo Lama di Dalam Sekolah (Harus Ditolak 400)
echo "[TEST 6] POST /api/v1/presensi/scan (Token Demo PSAS-QR-DEMO-TODAY - Expected 400)\n";
$res6 = testEndpoint('POST', "$baseUrl/presensi/scan", ['Authorization' => "Bearer $siswaToken"], [
    'qr_token' => 'PSAS-QR-DEMO-TODAY',
    'latitude' => -7.435210,
    'longitude' => 109.249210,
]);
echo "Status: {$res6['status']}\n";
echo "Message: " . ($res6['body']['message'] ?? '') . "\n\n";

// 7. Test Scan Token Admin Resmi di Dalam SMK Telkom Purwokerto (Expected 200)
echo "[TEST 7] POST /api/v1/presensi/scan (Token Admin Resmi di SMK Telkom Purwokerto - Expected 200)\n";
$res7 = testEndpoint('POST', "$baseUrl/presensi/scan", ['Authorization' => "Bearer $siswaToken"], [
    'qr_token' => $adminQrToken,
    'latitude' => -7.435250,
    'longitude' => 109.249150,
]);
echo "Status: {$res7['status']}\n";
echo "Message: " . ($res7['body']['message'] ?? '') . "\n";
echo "Lokasi: " . ($res7['body']['data']['lokasi_sekolah'] ?? '-') . " (" . ($res7['body']['data']['jarak_meter'] ?? '-') . " m)\n\n";

// 8. Test Presensi Today + Geofence Payload
echo "[TEST 8] GET /api/v1/presensi/today\n";
$res8 = testEndpoint('GET', "$baseUrl/presensi/today", ['Authorization' => "Bearer $siswaToken"]);
echo "Status: {$res8['status']} | Sekolah: " . ($res8['body']['data']['school_geofence']['name'] ?? '') . "\n";
echo "Radius Maks: " . ($res8['body']['data']['school_geofence']['radius_meters'] ?? '') . " m\n\n";

// 9. Test Login Guru Firda Ayu Nirmala & Monitoring XI PPLG 4
echo "[TEST 9] POST /api/v1/login & GET /api/v1/guru/monitoring\n";
$res9Login = testEndpoint('POST', "$baseUrl/login", [], [
    'nis_nip' => '198804122015032003',
    'password' => 'guru123'
]);
$guruToken = $res9Login['body']['data']['token'] ?? null;
$res9Mon = testEndpoint('GET', "$baseUrl/guru/monitoring?kelas=" . urlencode('XI PPLG 4'), ['Authorization' => "Bearer $guruToken"]);
echo "Guru: " . ($res9Login['body']['data']['user']['nama_lengkap'] ?? '') . " | Monitoring Status: {$res9Mon['status']} | Siswa: " . ($res9Mon['body']['data']['ringkasan']['total_siswa'] ?? 0) . "\n\n";

// 10. Test Login Orang Tua via Double NIS (541251041541251041)
echo "[TEST 10] POST /api/v1/login (Orang Tua: 541251041541251041)\n";
$res10 = testEndpoint('POST', "$baseUrl/login", [], [
    'nis_nip' => '541251041541251041',
    'password' => '541251041541251041'
]);
$ortuToken = $res10['body']['data']['token'] ?? null;
echo "Status: {$res10['status']} | Role: " . ($res10['body']['data']['user']['role'] ?? '') . " | Anak: " . ($res10['body']['data']['user']['child_name'] ?? '') . "\n\n";

// 11. Test Orang Tua pantau aktivitas & riwayat anaknya
echo "[TEST 11] GET /api/v1/presensi/today (Orang Tua cek aktivitas anak)\n";
$res11 = testEndpoint('GET', "$baseUrl/presensi/today", ['Authorization' => "Bearer $ortuToken"]);
echo "Status: {$res11['status']} | Anak: " . ($res11['body']['data']['anak']['nama_lengkap'] ?? '') . " | Riwayat count: " . count($res11['body']['data']['riwayat_terbaru'] ?? []) . "\n\n";

// 12. Test Orang Tua dilarang scan QR (Expected 403)
echo "[TEST 12] POST /api/v1/presensi/scan (Orang Tua diblokir - Expected 403)\n";
$res12 = testEndpoint('POST', "$baseUrl/presensi/scan", ['Authorization' => "Bearer $ortuToken"], [
    'qr_token' => $adminQrToken,
    'latitude' => -7.435210,
    'longitude' => 109.249210,
]);
echo "Status: {$res12['status']} | Message: " . ($res12['body']['message'] ?? '') . "\n\n";

// 13. Test Orang Tua dilarang buka rekap seluruh kelas guru (Expected 403)
echo "[TEST 13] GET /api/v1/guru/monitoring (Orang Tua diblokir - Expected 403)\n";
$res13 = testEndpoint('GET', "$baseUrl/guru/monitoring?kelas=" . urlencode('XI PPLG 4'), ['Authorization' => "Bearer $ortuToken"]);
echo "Status: {$res13['status']} | Message: " . ($res13['body']['message'] ?? '') . "\n\n";

// 14. Logout
echo "[TEST 14] POST /api/v1/logout\n";
$res14 = testEndpoint('POST', "$baseUrl/logout", ['Authorization' => "Bearer $siswaToken"]);
echo "Status: {$res14['status']}\n";
echo "========================================================\n";
