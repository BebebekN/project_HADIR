import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { del, put } from '@vercel/blob';
import {
  authenticateBearer,
  ensureDbReady,
  ensureTodayQrToken,
  formatUserPayload,
  regenerateTodayQrToken,
  resolveKbmEndForSubject,
  resolveSubject,
  verifyPassword,
} from './_lib/db.js';
import {
  ATTENDANCE_CONFIG,
  SCHOOL_CONFIG,
  buildAttendanceNotification,
  calculateBintang,
  calculateDistanceMeters,
  defaultEmailFor,
  formatIndoDate,
  formatShortIndoDate,
  getDayIndex,
  getJakartaNow,
  getPredikat,
} from './_lib/time.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

function getRoutePath(request) {
  const url = new URL(request.url);
  const routeParam = url.searchParams.get('route');
  if (routeParam !== null) {
    return '/' + routeParam.replace(/^\/+|\/+$/g, '');
  }
  const stripped = url.pathname.replace(/^\/api\/v1/, '').replace(/\/+$/, '');
  return stripped || '/';
}

function getOrigin(request) {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '') || 'https';
  return `${proto}://${host}`;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request) {
  return handleRequest(request, 'GET');
}

export async function POST(request) {
  return handleRequest(request, 'POST');
}

export async function DELETE(request) {
  return handleRequest(request, 'DELETE');
}

async function handleRequest(request, method) {
  try {
    const sql = await ensureDbReady();
    const path = getRoutePath(request);
    const origin = getOrigin(request);
    const url = new URL(request.url);

    // Health check endpoint
    if (method === 'GET' && (path === '/' || path === '/health')) {
      return json({ success: true, message: 'HADIR Cloud API aktif.', school: SCHOOL_CONFIG.name });
    }

    // 1. POST /api/v1/login
    if (method === 'POST' && path === '/login') {
      const body = await request.json().catch(() => ({}));
      const identifier = String(body.email || body.login || body.nis_nip || '').trim();
      const password = String(body.password || '');

      if (!identifier || !password) {
        return json(
          {
            success: false,
            message: 'Validasi gagal.',
            errors: {
              ...(identifier ? {} : { email: ['Email sekolah atau NIS/NIP wajib diisi.'] }),
              ...(password ? {} : { password: ['Kata sandi wajib diisi.'] }),
            },
          },
          422
        );
      }

      const lowerId = identifier.toLowerCase();
      const users = await sql`
        SELECT * FROM users
        WHERE LOWER(email) = ${lowerId} OR nis_nip = ${identifier}
        LIMIT 1
      `;
      const user = users[0];
      if (!user || !verifyPassword(password, user.password)) {
        return json(
          {
            success: false,
            message: 'Email sekolah / NIS/NIP atau kata sandi yang Anda masukkan salah.',
          },
          401
        );
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await sql`
        INSERT INTO api_tokens (token_hash, user_id)
        VALUES (${tokenHash}, ${user.id})
      `;

      const subject = await resolveSubject(sql, user);

      return json({
        success: true,
        message: 'Login berhasil.',
        data: {
          token: rawToken,
          token_type: 'Bearer',
          user: formatUserPayload(user, subject, origin),
        },
      });
    }

    // 1b. POST /api/v1/forgot-password
    if (method === 'POST' && path === '/forgot-password') {
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || '').trim().toLowerCase();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ success: false, message: 'Masukkan alamat email sekolah yang valid.' }, 422);
      }

      const users = await sql`
        SELECT * FROM users WHERE LOWER(email) = ${email} LIMIT 1
      `;
      const targetUser = users[0];
      if (!targetUser) {
        return json(
          {
            success: false,
            message: 'Email sekolah tersebut tidak terdaftar di sistem HADIR.',
          },
          404
        );
      }

      const resendKey = String(process.env.RESEND_API_KEY || '').trim();
      const smtpHost = String(process.env.SMTP_HOST || process.env.MAIL_HOST || '').trim();

      if (!resendKey && !smtpHost) {
        return json(
          {
            success: false,
            message:
              'Layanan pengiriman email reset kata sandi belum dikonfigurasi pada server. Hubungi Admin Sekolah untuk mengatur RESEND_API_KEY atau SMTP.',
          },
          503
        );
      }

      const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
      const codeHash = bcrypt.hashSync(code, 8);
      await sql`
        INSERT INTO password_reset_tokens (email, token, created_at)
        VALUES (${email}, ${codeHash}, NOW())
        ON CONFLICT (email) DO UPDATE SET token = EXCLUDED.token, created_at = NOW()
      `;

      const subjectLine = '[HADIR SMK Telkom] Kode Reset Kata Sandi Anda';
      const textBody = [
        `Halo ${targetUser.nama_lengkap},`,
        '',
        `Anda mengajukan permintaan reset kata sandi untuk akun HADIR (${targetUser.nis_nip}).`,
        'Kode verifikasi 6-digit Anda adalah:',
        '',
        `    ${code}`,
        '',
        'Kode ini berlaku selama 15 menit. Jangan bagikan kode ini kepada siapa pun.',
        '',
        'Salam,',
        'Tim HADIR SMK Telkom Purwokerto',
      ].join('\n');

      try {
        if (resendKey) {
          const fromEmail =
            process.env.RESEND_FROM_EMAIL ||
            process.env.MAIL_FROM_ADDRESS ||
            'HADIR SMK Telkom <onboarding@resend.dev>';
          const mailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [email],
              subject: subjectLine,
              text: textBody,
            }),
          });
          if (!mailRes.ok) {
            throw new Error(`Resend HTTP ${mailRes.status}`);
          }
        } else {
          const smtpPort = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
          const smtpUser = process.env.SMTP_USER || process.env.MAIL_USERNAME || '';
          const smtpPass = process.env.SMTP_PASS || process.env.MAIL_PASSWORD || '';
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
          });
          await transporter.sendMail({
            from: process.env.MAIL_FROM_ADDRESS || smtpUser || 'no-reply@smktelkom-pwt.sch.id',
            to: email,
            subject: subjectLine,
            text: textBody,
          });
        }
      } catch (mailErr) {
        console.error('Mail dispatch error:', mailErr);
        return json(
          {
            success: false,
            message: 'Gagal mengirim email verifikasi. Periksa konfigurasi email server atau coba lagi nanti.',
          },
          502
        );
      }

      return json({
        success: true,
        message: `Kode reset kata sandi (6 digit) telah dikirim ke ${email}. Berlaku selama 15 menit.`,
      });
    }

    // 1c. POST /api/v1/reset-password
    if (method === 'POST' && path === '/reset-password') {
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || '').trim().toLowerCase();
      const code = String(body.code || '').trim();
      const password = String(body.password || '');
      const passwordConfirmation = String(body.password_confirmation ?? password);

      if (!email || !/^\d{6}$/.test(code) || password.length < 6 || password !== passwordConfirmation) {
        return json(
          {
            success: false,
            message:
              password !== passwordConfirmation
                ? 'Konfirmasi kata sandi baru tidak cocok.'
                : password.length < 6
                ? 'Kata sandi baru minimal 6 karakter.'
                : 'Email sekolah dan kode OTP 6 digit wajib diisi.',
          },
          422
        );
      }

      const tokenRows = await sql`
        SELECT * FROM password_reset_tokens WHERE LOWER(email) = ${email} LIMIT 1
      `;
      const resetRow = tokenRows[0];
      if (!resetRow || !resetRow.created_at) {
        return json({ success: false, message: 'Kode verifikasi tidak ditemukan atau sudah kedaluwarsa.' }, 422);
      }

      const ageMs = Date.now() - new Date(resetRow.created_at).getTime();
      if (Number.isNaN(ageMs) || ageMs > 15 * 60 * 1000) {
        return json(
          { success: false, message: 'Kode verifikasi sudah kedaluwarsa (lebih dari 15 menit). Minta kode baru.' },
          422
        );
      }

      if (!verifyPassword(code, resetRow.token)) {
        return json({ success: false, message: 'Kode verifikasi 6 digit tidak sesuai.' }, 422);
      }

      const users = await sql`SELECT id FROM users WHERE LOWER(email) = ${email} LIMIT 1`;
      if (!users[0]) {
        return json({ success: false, message: 'Akun pengguna tidak ditemukan.' }, 404);
      }

      const newHash = bcrypt.hashSync(password, 8);
      await sql`
        UPDATE users SET password = ${newHash}, updated_at = NOW() WHERE id = ${users[0].id}
      `;
      await sql`DELETE FROM password_reset_tokens WHERE LOWER(email) = ${email}`;

      return json({
        success: true,
        message: 'Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru Anda.',
      });
    }

    // Authenticated routes below
    const auth = await authenticateBearer(sql, request);
    if (!auth) {
      return json({ success: false, message: 'Sesi tidak valid atau belum login.' }, 401);
    }
    const { user, subject, tokenHash } = auth;

    // 2. POST /api/v1/logout
    if (method === 'POST' && path === '/logout') {
      await sql`DELETE FROM api_tokens WHERE token_hash = ${tokenHash}`;
      return json({ success: true, message: 'Logout berhasil. Sesi telah diakhiri.' });
    }

    // 3. GET /api/v1/user
    if (method === 'GET' && path === '/user') {
      return json({
        success: true,
        message: 'Data profil berhasil diambil.',
        data: formatUserPayload(user, subject, origin),
      });
    }

    // 4. POST /api/v1/user/photo
    if (method === 'POST' && path === '/user/photo') {
      const formData = await request.formData().catch(() => null);
      const file = formData?.get('photo');
      if (!file || typeof file === 'string' || !file.size) {
        return json({ success: false, message: 'Pilih file foto terlebih dahulu.' }, 422);
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
        return json({ success: false, message: 'Format foto harus JPG, PNG, atau WEBP.' }, 422);
      }
      if (file.size > 4.4 * 1024 * 1024) {
        return json({ success: false, message: 'Ukuran foto maksimal 4 MB.' }, 422);
      }

      if (user.avatar_path && user.avatar_path.includes('blob.vercel-storage.com')) {
        await del(user.avatar_path, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => {});
      }

      const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const blobName = `avatars/avatar_${user.id}_${Date.now()}.${ext}`;
      const blob = await put(blobName, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: file.type || 'image/jpeg',
      });

      const updatedRows = await sql`
        UPDATE users SET avatar_path = ${blob.url}, updated_at = NOW()
        WHERE id = ${user.id}
        RETURNING *
      `;
      const updatedUser = updatedRows[0] || { ...user, avatar_path: blob.url };
      const nextSubject = await resolveSubject(sql, updatedUser);

      return json({
        success: true,
        message: 'Foto profil berhasil diperbarui.',
        data: formatUserPayload(updatedUser, nextSubject, origin),
      });
    }

    // 5. DELETE /api/v1/user/photo
    if (method === 'DELETE' && path === '/user/photo') {
      if (user.avatar_path && user.avatar_path.includes('blob.vercel-storage.com')) {
        await del(user.avatar_path, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => {});
      }

      const updatedRows = await sql`
        UPDATE users SET avatar_path = NULL, updated_at = NOW()
        WHERE id = ${user.id}
        RETURNING *
      `;
      const updatedUser = updatedRows[0] || { ...user, avatar_path: null };
      const nextSubject = await resolveSubject(sql, updatedUser);

      return json({
        success: true,
        message: 'Foto profil dihapus dan dikembalikan ke inisial.',
        data: formatUserPayload(updatedUser, nextSubject, origin),
      });
    }

    // 6. GET /api/v1/dashboard
    if (method === 'GET' && path === '/dashboard') {
      const jakartaNow = getJakartaNow();
      const presensiRows = await sql`
        SELECT * FROM presensis WHERE user_id = ${subject.id} AND tanggal = ${jakartaNow.dateStr} LIMIT 1
      `;
      const presensiToday = presensiRows[0] || null;

      const statsRows = await sql`
        SELECT
          COUNT(*)::int AS total_hadir,
          COUNT(*) FILTER (WHERE status = 'Tepat Waktu')::int AS total_tepat_waktu,
          COUNT(*) FILTER (WHERE status = 'Terlambat')::int AS total_terlambat
        FROM presensis
        WHERE user_id = ${subject.id}
      `;
      const totalHadir = statsRows[0]?.total_hadir ?? 0;
      const totalTepatWaktu = statsRows[0]?.total_tepat_waktu ?? 0;
      const totalTerlambat = statsRows[0]?.total_terlambat ?? 0;

      let jadwalHariIni = [];
      if (!jakartaNow.isWeekend && subject.kelas) {
        const rawJadwal = await sql`
          SELECT * FROM jadwals
          WHERE kelas = ${subject.kelas} AND hari = ${jakartaNow.hari}
          ORDER BY jam_mulai ASC
        `;
        jadwalHariIni = rawJadwal.map((item) => {
          let statusWaktu = 'upcoming';
          let centangHijau = false;
          if (jakartaNow.hhmmss >= item.jam_selesai) {
            statusWaktu = 'completed';
            centangHijau = true;
          } else if (jakartaNow.hhmmss >= item.jam_mulai && jakartaNow.hhmmss < item.jam_selesai) {
            statusWaktu = 'ongoing';
          }
          return {
            id: item.id,
            nama_kegiatan: item.nama_kegiatan,
            nama_guru: item.nama_guru,
            jam_mulai: item.jam_mulai.slice(0, 5),
            jam_selesai: item.jam_selesai.slice(0, 5),
            durasi: `${item.jam_mulai.slice(0, 5)} - ${item.jam_selesai.slice(0, 5)}`,
            status_waktu: statusWaktu,
            centang_hijau: centangHijau,
          };
        });
      }

      return json({
        success: true,
        message: 'Dashboard berhasil dimuat.',
        data: {
          user: formatUserPayload(user, subject, origin),
          presensi_hari_ini: {
            sudah_presensi: presensiToday !== null,
            tanggal: formatIndoDate(jakartaNow.dateStr),
            jam_datang: presensiToday?.jam_datang ? `${presensiToday.jam_datang.slice(0, 5)} WIB` : null,
            jam_pulang: presensiToday?.jam_pulang ? `${presensiToday.jam_pulang.slice(0, 5)} WIB` : null,
            status: presensiToday?.status || 'Belum Presensi',
            poin_perubahan: presensiToday?.poin_perubahan ?? 0,
          },
          statistik_kehadiran: {
            total_kehadiran: totalHadir,
            tepat_waktu: totalTepatWaktu,
            terlambat: totalTerlambat,
            persentase_kedisiplinan:
              totalHadir > 0 ? `${Math.round((totalTepatWaktu / totalHadir) * 100)}%` : '100%',
          },
          jadwal_hari_ini: {
            hari: jakartaNow.hari,
            is_weekend: jakartaNow.isWeekend,
            pesan_libur: jakartaNow.isWeekend
              ? 'Akhir Pekan Libur. Waktu yang tepat untuk istirahat!'
              : null,
            items: jadwalHariIni,
          },
          info_pkl: {
            judul: 'Sistem Rapor Bintang PKL',
            deskripsi:
              'Setiap siswa memulai dengan 100 poin (5.0 ★). Keterlambatan scan lewat pukul 07:00 WIB otomatis mengurangi -5 poin dan mempengaruhi predikat rapor PKL akhir.',
          },
          notifikasi_presensi: buildAttendanceNotification(user, subject, presensiToday, jakartaNow),
        },
      });
    }

    // 7. GET /api/v1/jadwal
    if (method === 'GET' && path === '/jadwal') {
      const targetKelas = url.searchParams.get('kelas') || subject.kelas || 'XI PPLG 4';
      const jakartaNow = getJakartaNow();

      const rows = await sql`
        SELECT * FROM jadwals
        WHERE kelas = ${targetKelas}
        ORDER BY CASE
          WHEN hari = 'Senin' THEN 1
          WHEN hari = 'Selasa' THEN 2
          WHEN hari = 'Rabu' THEN 3
          WHEN hari = 'Kamis' THEN 4
          WHEN hari = 'Jumat' THEN 5
          ELSE 6 END,
          jam_mulai ASC
      `;

      const processed = rows.map((item) => {
        const itemDayIdx = getDayIndex(item.hari);
        const isSameDay = item.hari === jakartaNow.hari;
        let statusWaktu = 'upcoming';
        let centangHijau = false;

        if (jakartaNow.isWeekend) {
          statusWaktu = 'libur';
        } else if (itemDayIdx < jakartaNow.dayIndex) {
          statusWaktu = 'completed';
          centangHijau = true;
        } else if (isSameDay) {
          if (jakartaNow.hhmmss >= item.jam_selesai) {
            statusWaktu = 'completed';
            centangHijau = true;
          } else if (jakartaNow.hhmmss >= item.jam_mulai && jakartaNow.hhmmss < item.jam_selesai) {
            statusWaktu = 'ongoing';
          }
        }

        return {
          id: item.id,
          kelas: item.kelas,
          hari: item.hari,
          nama_kegiatan: item.nama_kegiatan,
          nama_guru: item.nama_guru,
          jam_mulai: item.jam_mulai.slice(0, 5),
          jam_selesai: item.jam_selesai.slice(0, 5),
          durasi: `${item.jam_mulai.slice(0, 5)} - ${item.jam_selesai.slice(0, 5)}`,
          is_hari_ini: isSameDay,
          status_waktu: statusWaktu,
          centang_hijau: centangHijau,
        };
      });

      const grouped = {
        Senin: processed.filter((i) => i.hari === 'Senin'),
        Selasa: processed.filter((i) => i.hari === 'Selasa'),
        Rabu: processed.filter((i) => i.hari === 'Rabu'),
        Kamis: processed.filter((i) => i.hari === 'Kamis'),
        Jumat: processed.filter((i) => i.hari === 'Jumat'),
      };

      return json({
        success: true,
        message: jakartaNow.isWeekend
          ? 'Hari ini adalah Libur Akhir Pekan (Sabtu/Minggu).'
          : `Jadwal pelajaran hari ${jakartaNow.hari} berhasil diambil.`,
        data: {
          kelas: targetKelas,
          hari_ini: jakartaNow.hari,
          jam_sekarang: `${jakartaNow.hhmm} WIB`,
          is_weekend: jakartaNow.isWeekend,
          libur_akhir_pekan: jakartaNow.isWeekend,
          pesan_libur: jakartaNow.isWeekend
            ? 'Libur Akhir Pekan. Selamat beristirahat dan mengisi energi kembali!'
            : null,
          carousel_hari_ini: jakartaNow.isWeekend ? [] : processed.filter((i) => i.is_hari_ini),
          jadwal_mingguan: grouped,
        },
      });
    }

    // 8. GET /api/v1/presensi/today
    if (method === 'GET' && path === '/presensi/today') {
      const jakartaNow = getJakartaNow();
      const todayRows = await sql`
        SELECT * FROM presensis WHERE user_id = ${subject.id} AND tanggal = ${jakartaNow.dateStr} LIMIT 1
      `;
      const presensi = todayRows[0] || null;
      const kbm = await resolveKbmEndForSubject(sql, subject, jakartaNow);
      const sudahDatang = presensi !== null && presensi.jam_datang !== null;
      const sudahPulang = presensi !== null && presensi.jam_pulang !== null;
      const alasanPulangTerkunci = sudahPulang
        ? 'Anda sudah menyelesaikan presensi datang dan pulang hari ini.'
        : !sudahDatang
        ? 'Scan QR Code Datang terlebih dahulu untuk membuka presensi pulang.'
        : !kbm.kbmSudahSelesai
        ? `QR Code Pulang aktif setelah kegiatan belajar mengajar selesai pukul ${kbm.kbmSelesai} WIB.`
        : null;

      const historyRows = await sql`
        SELECT * FROM presensis WHERE user_id = ${subject.id} ORDER BY tanggal DESC LIMIT 10
      `;
      const riwayatTerbaru = historyRows.map((item) => ({
        tanggal: String(item.tanggal).slice(0, 10),
        tanggal_label: formatShortIndoDate(item.tanggal),
        jam_datang: item.jam_datang ? `${item.jam_datang.slice(0, 5)} WIB` : null,
        jam_pulang: item.jam_pulang ? `${item.jam_pulang.slice(0, 5)} WIB` : null,
        status: item.status,
        poin_perubahan: item.poin_perubahan,
      }));

      return json({
        success: true,
        message: 'Data presensi hari ini berhasil diambil.',
        data: {
          sudah_presensi: presensi !== null,
          sudah_datang: sudahDatang,
          sudah_pulang: sudahPulang,
          kbm_selesai: `${kbm.kbmSelesai} WIB`,
          kbm_sudah_selesai: kbm.kbmSudahSelesai,
          boleh_scan_datang: !sudahDatang,
          boleh_scan_pulang: sudahDatang && !sudahPulang && kbm.kbmSudahSelesai,
          alasan_pulang_terkunci: alasanPulangTerkunci,
          tanggal: jakartaNow.dateStr,
          jam_datang: presensi?.jam_datang ? `${presensi.jam_datang.slice(0, 5)} WIB` : null,
          jam_pulang: presensi?.jam_pulang ? `${presensi.jam_pulang.slice(0, 5)} WIB` : null,
          status: presensi?.status || 'Belum Hadir',
          poin_perubahan: presensi?.poin_perubahan ?? 0,
          anak: {
            nis_nip: subject.nis_nip,
            email: subject.email || defaultEmailFor(subject.nis_nip, subject.role),
            nama_lengkap: subject.nama_lengkap,
            kelas: subject.kelas,
          },
          riwayat_terbaru: riwayatTerbaru,
          school_geofence: SCHOOL_CONFIG,
        },
      });
    }

    // 9. POST /api/v1/presensi/scan
    if (method === 'POST' && path === '/presensi/scan') {
      if (user.role === 'orang_tua') {
        return json(
          {
            success: false,
            message: 'Akun Orang Tua hanya dapat memantau aktivitas anak dan tidak dapat melakukan presensi QR.',
          },
          403
        );
      }

      const body = await request.json().catch(() => ({}));
      const rawToken = String(body.qr_token || '').trim();
      const userLat = Number(body.latitude);
      const userLng = Number(body.longitude);

      if (!rawToken) {
        return json({ success: false, message: 'Kode QR dari Admin tidak boleh kosong.' }, 422);
      }
      if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
        return json(
          {
            success: false,
            message: `Lokasi GPS wajib aktif untuk memastikan presensi di kawasan ${SCHOOL_CONFIG.name}.`,
          },
          422
        );
      }

      const distanceMeters = calculateDistanceMeters(
        userLat,
        userLng,
        SCHOOL_CONFIG.latitude,
        SCHOOL_CONFIG.longitude
      );
      const roundedDistance = Math.round(distanceMeters);

      if (distanceMeters > SCHOOL_CONFIG.radius_meters) {
        return json(
          {
            success: false,
            message: `Presensi ditolak! Anda berada di luar kawasan ${SCHOOL_CONFIG.name} (jarak ${roundedDistance} m, batas maksimal ${Math.round(SCHOOL_CONFIG.radius_meters)} m dari sekolah).`,
            data: {
              jarak_meter: roundedDistance,
              radius_maksimal_meter: Math.round(SCHOOL_CONFIG.radius_meters),
              lokasi_sekolah: SCHOOL_CONFIG.name,
            },
          },
          403
        );
      }

      let extractedToken = rawToken;
      let payloadType = null;
      if (rawToken.startsWith('{') && rawToken.endsWith('}')) {
        try {
          const parsed = JSON.parse(rawToken);
          if (parsed && typeof parsed.token === 'string') {
            extractedToken = parsed.token.trim();
            if (typeof parsed.type === 'string') {
              payloadType = parsed.type.trim().toLowerCase();
            }
          }
        } catch {
          // keep raw token
        }
      }

      const jakartaNow = getJakartaNow();
      const dailyToken = await ensureTodayQrToken(sql, jakartaNow.dateStr);
      const tokenDatang = String(dailyToken?.token_datang || dailyToken?.token || '');
      const tokenPulang = String(dailyToken?.token_pulang || '');

      const matchesDatang = Boolean(extractedToken && tokenDatang && extractedToken === tokenDatang);
      const matchesPulang = Boolean(extractedToken && tokenPulang && extractedToken === tokenPulang);

      if (!dailyToken || (!matchesDatang && !matchesPulang)) {
        return json(
          {
            success: false,
            message: 'Kode QR tidak valid, bukan buatan Admin, atau sudah kedaluwarsa untuk hari ini.',
          },
          400
        );
      }

      if (payloadType && ((matchesDatang && payloadType !== 'datang') || (matchesPulang && payloadType !== 'pulang'))) {
        return json(
          {
            success: false,
            message: 'Payload QR Code tidak sesuai jenis QR Datang/Pulang.',
          },
          400
        );
      }

      const kbm = await resolveKbmEndForSubject(sql, subject, jakartaNow);

      const existingRows = await sql`
        SELECT * FROM presensis WHERE user_id = ${user.id} AND tanggal = ${jakartaNow.dateStr} LIMIT 1
      `;
      const presensi = existingRows[0];

      if (matchesDatang) {
        if (presensi) {
          return json(
            {
              success: false,
              message:
                'Anda sudah melakukan presensi Datang hari ini. Gunakan QR Code Pulang setelah kegiatan belajar mengajar selesai.',
              data: {
                tipe_scan: 'datang',
                jam_datang: presensi.jam_datang ? `${String(presensi.jam_datang).slice(0, 5)} WIB` : null,
                jam_pulang: presensi.jam_pulang ? `${String(presensi.jam_pulang).slice(0, 5)} WIB` : null,
                status: presensi.status,
              },
            },
            422
          );
        }

        const deadlineFull =
          ATTENDANCE_CONFIG.checkInDeadline.length === 5
            ? `${ATTENDANCE_CONFIG.checkInDeadline}:00`
            : ATTENDANCE_CONFIG.checkInDeadline;
        const isTepatWaktu = jakartaNow.hhmmss <= deadlineFull;
        const status = isTepatWaktu ? 'Tepat Waktu' : 'Terlambat';
        const poinPerubahan = isTepatWaktu ? 0 : -5;

        let newPoin = Number(user.poin_kedisiplinan ?? 100);
        let newBintang = Number(user.bintang ?? 5.0);
        if (!isTepatWaktu) {
          newPoin = Math.max(0, newPoin - 5);
          newBintang = calculateBintang(newPoin);
          await sql`
            UPDATE users SET poin_kedisiplinan = ${newPoin}, bintang = ${newBintang}, updated_at = NOW()
            WHERE id = ${user.id}
          `;
        }

        await sql`
          INSERT INTO presensis (user_id, tanggal, jam_datang, jam_pulang, status, poin_perubahan)
          VALUES (${user.id}, ${jakartaNow.dateStr}, ${jakartaNow.hhmmss}, NULL, ${status}, ${poinPerubahan})
        `;

        return json({
          success: true,
          message: isTepatWaktu
            ? `Presensi Datang Berhasil di kawasan ${SCHOOL_CONFIG.name}! Anda hadir Tepat Waktu.`
            : `Presensi Datang tercatat di kawasan ${SCHOOL_CONFIG.name} (Terlambat). Poin kedisiplinan berkurang -5.`,
          data: {
            tipe_scan: 'datang',
            tanggal: jakartaNow.dateStr,
            jam_datang: `${jakartaNow.hhmm} WIB`,
            jam_pulang: null,
            status,
            poin_perubahan: poinPerubahan,
            sisa_poin: newPoin,
            bintang: newBintang,
            jarak_meter: roundedDistance,
            lokasi_sekolah: SCHOOL_CONFIG.name,
            kbm_selesai: `${kbm.kbmSelesai} WIB`,
            kbm_sudah_selesai: kbm.kbmSudahSelesai,
            pesan: isTepatWaktu
              ? `QR Code Pulang akan aktif setelah KBM selesai pukul ${kbm.kbmSelesai} WIB.`
              : 'Usahakan datang sebelum pukul 07:00 WIB di hari berikutnya untuk menjaga rapor PKL tetap prima.',
          },
        });
      }

      // QR Code Pulang flow
      if (!presensi || !presensi.jam_datang) {
        return json(
          {
            success: false,
            message: 'Presensi Pulang ditolak! Anda wajib melakukan scan QR Code Datang terlebih dahulu hari ini.',
            data: { tipe_scan: 'pulang', syarat_terpenuhi: false },
          },
          422
        );
      }

      if (presensi.jam_pulang !== null) {
        return json(
          {
            success: false,
            message: 'Anda sudah menyelesaikan presensi datang dan pulang untuk hari ini.',
            data: {
              jam_datang: `${String(presensi.jam_datang).slice(0, 5)} WIB`,
              jam_pulang: `${String(presensi.jam_pulang).slice(0, 5)} WIB`,
              status: presensi.status,
            },
          },
          422
        );
      }

      if (!kbm.kbmSudahSelesai) {
        return json(
          {
            success: false,
            message: `QR Code Pulang belum dibuka! Selesaikan kegiatan belajar mengajar hari ini terlebih dahulu (berakhir pukul ${kbm.kbmSelesai} WIB).`,
            data: {
              tipe_scan: 'pulang',
              kbm_selesai: `${kbm.kbmSelesai} WIB`,
              waktu_sekarang: `${jakartaNow.hhmm} WIB`,
              kbm_sudah_selesai: false,
            },
          },
          422
        );
      }

      await sql`
        UPDATE presensis SET jam_pulang = ${jakartaNow.hhmmss}, updated_at = NOW() WHERE id = ${presensi.id}
      `;

      return json({
        success: true,
        message: `Presensi Pulang Berhasil di kawasan ${SCHOOL_CONFIG.name}! Hati-hati di jalan.`,
        data: {
          tipe_scan: 'pulang',
          tanggal: jakartaNow.dateStr,
          jam_datang: `${String(presensi.jam_datang).slice(0, 5)} WIB`,
          jam_pulang: `${jakartaNow.hhmm} WIB`,
          status: presensi.status,
          poin_perubahan: presensi.poin_perubahan,
          sisa_poin: Number(user.poin_kedisiplinan ?? 100),
          bintang: Number(user.bintang ?? 5.0),
          jarak_meter: roundedDistance,
          lokasi_sekolah: SCHOOL_CONFIG.name,
          kbm_selesai: `${kbm.kbmSelesai} WIB`,
          kbm_sudah_selesai: true,
        },
      });
    }

    // 10. GET /api/v1/guru/monitoring
    if (method === 'GET' && path === '/guru/monitoring') {
      if (!['guru', 'admin'].includes(user.role)) {
        return json(
          {
            success: false,
            message: 'Akses ditolak. Hanya Guru dan Admin yang dapat melihat rekap seluruh kelas.',
          },
          403
        );
      }

      const jakartaNow = getJakartaNow();
      const selectedKelas = url.searchParams.get('kelas') || 'XI PPLG 4';
      const selectedTanggal = url.searchParams.get('tanggal') || jakartaNow.dateStr;

      const students = await sql`
        SELECT
          u.id,
          u.nis_nip,
          u.nama_lengkap,
          u.kelas,
          u.poin_kedisiplinan,
          u.bintang,
          p_today.jam_datang AS today_jam_datang,
          p_today.jam_pulang AS today_jam_pulang,
          p_today.status AS today_status,
          COUNT(p_all.id)::int AS total_hadir,
          COUNT(p_all.id) FILTER (WHERE p_all.status = 'Tepat Waktu')::int AS total_tepat_waktu,
          COUNT(p_all.id) FILTER (WHERE p_all.status = 'Terlambat')::int AS total_terlambat
        FROM users u
        LEFT JOIN presensis p_today ON p_today.user_id = u.id AND p_today.tanggal = ${selectedTanggal}
        LEFT JOIN presensis p_all ON p_all.user_id = u.id
        WHERE u.role = 'siswa' AND u.kelas = ${selectedKelas}
        GROUP BY u.id, p_today.jam_datang, p_today.jam_pulang, p_today.status
        ORDER BY u.nama_lengkap ASC
      `;

      let totalHadirHariIni = 0;
      let tepatWaktuHariIni = 0;
      let terlambatHariIni = 0;
      let totalBintang = 0;

      const studentList = students.map((s) => {
        const bintang = Number(s.bintang ?? 5.0);
        totalBintang += bintang;

        let statusHariIni = 'Belum Hadir';
        let jamDatang = null;
        let jamPulang = null;

        if (s.today_status) {
          totalHadirHariIni++;
          statusHariIni = s.today_status;
          jamDatang = s.today_jam_datang ? `${String(s.today_jam_datang).slice(0, 5)} WIB` : null;
          jamPulang = s.today_jam_pulang ? `${String(s.today_jam_pulang).slice(0, 5)} WIB` : null;
          if (s.today_status === 'Tepat Waktu') tepatWaktuHariIni++;
          else terlambatHariIni++;
        }

        return {
          user_id: s.id,
          nis: s.nis_nip,
          nama_lengkap: s.nama_lengkap,
          kelas: s.kelas,
          status_hari_ini: statusHariIni,
          jam_datang: jamDatang,
          jam_pulang: jamPulang,
          total_kehadiran: s.total_hadir,
          total_tepat_waktu: s.total_tepat_waktu,
          total_terlambat: s.total_terlambat,
          poin_kedisiplinan: Number(s.poin_kedisiplinan ?? 100),
          bintang,
          predikat: getPredikat(bintang),
        };
      });

      const totalSiswa = studentList.length;
      const belumHadirHariIni = Math.max(0, totalSiswa - totalHadirHariIni);
      const rataRataBintang = totalSiswa > 0 ? Math.round((totalBintang / totalSiswa) * 10) / 10 : 5.0;

      return json({
        success: true,
        message: 'Data monitoring presensi & rapor PKL berhasil diambil.',
        data: {
          kelas: selectedKelas,
          tanggal: selectedTanggal,
          ringkasan: {
            total_siswa: totalSiswa,
            hadir_hari_ini: totalHadirHariIni,
            tepat_waktu: tepatWaktuHariIni,
            terlambat: terlambatHariIni,
            belum_hadir: belumHadirHariIni,
            rata_rata_bintang: rataRataBintang,
          },
          siswa: studentList,
        },
      });
    }

    // 11. Admin / Guru QR Token Display & Regenerate (online parity with Filament QR Generator)
    if (path === '/admin/qr' && (method === 'GET' || method === 'POST')) {
      if (!['guru', 'admin'].includes(user.role)) {
        return json({ success: false, message: 'Hanya Guru/Admin yang dapat mengakses token QR.' }, 403);
      }
      const jakartaNow = getJakartaNow();
      const record =
        method === 'POST'
          ? await regenerateTodayQrToken(sql, jakartaNow.dateStr)
          : await ensureTodayQrToken(sql, jakartaNow.dateStr);
      const tokenDatang = record?.token_datang || record?.token || null;
      const tokenPulang = record?.token_pulang || null;
      const kbm = await resolveKbmEndForSubject(sql, subject, jakartaNow);

      return json({
        success: true,
        data: {
          tanggal: jakartaNow.dateStr,
          tanggal_label: formatIndoDate(jakartaNow.dateStr),
          token: tokenDatang,
          token_datang: tokenDatang,
          token_pulang: tokenPulang,
          payload: JSON.stringify({
            app: 'HADIR-PSAS',
            type: 'datang',
            token: tokenDatang,
            tanggal: jakartaNow.dateStr,
          }),
          payload_datang: JSON.stringify({
            app: 'HADIR-PSAS',
            type: 'datang',
            token: tokenDatang,
            tanggal: jakartaNow.dateStr,
          }),
          payload_pulang: JSON.stringify({
            app: 'HADIR-PSAS',
            type: 'pulang',
            token: tokenPulang,
            tanggal: jakartaNow.dateStr,
          }),
          kbm_selesai: `${kbm.kbmSelesai} WIB`,
          kbm_sudah_selesai: kbm.kbmSudahSelesai,
          jam_mulai: record?.jam_mulai?.slice(0, 5) || '06:00',
          jam_selesai: record?.jam_selesai?.slice(0, 5) || '17:00',
        },
      });
    }

    return json({ success: false, message: `Endpoint ${method} ${path} tidak ditemukan.` }, 404);
  } catch (err) {
    console.error('HADIR API error:', err);
    return json(
      {
        success: false,
        message: 'Terjadi gangguan pada server cloud HADIR.',
        detail: err?.message || 'Unknown error',
      },
      500
    );
  }
}
