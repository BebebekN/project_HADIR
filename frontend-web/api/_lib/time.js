const DAY_MAP = {
  Monday: 'Senin',
  Tuesday: 'Selasa',
  Wednesday: 'Rabu',
  Thursday: 'Kamis',
  Friday: 'Jumat',
  Saturday: 'Sabtu',
  Sunday: 'Minggu',
};

const DAY_INDEX = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
  Minggu: 7,
};

export const SCHOOL_CONFIG = {
  name: process.env.HADIR_SCHOOL_NAME || 'SMK Telkom Purwokerto',
  address: 'Jl. D.I. Panjaitan No. 128, Purwokerto Selatan, Banyumas',
  latitude: Number(process.env.HADIR_SCHOOL_LAT || -7.43521),
  longitude: Number(process.env.HADIR_SCHOOL_LNG || 109.24921),
  radius_meters: Number(process.env.HADIR_SCHOOL_RADIUS_METERS || 150),
};

export const ATTENDANCE_CONFIG = {
  checkInDeadline: process.env.HADIR_CHECKIN_DEADLINE || '07:00',
  warningMinutesBefore: Number(process.env.HADIR_WARNING_MINUTES_BEFORE || 10),
  defaultKbmEnd: process.env.HADIR_DEFAULT_KBM_END || '15:30',
};

export function defaultEmailFor(nisNip, role = 'siswa') {
  const clean = String(nisNip || '').trim().toLowerCase();
  const studentDomain = process.env.HADIR_STUDENT_EMAIL_DOMAIN || 'student.smktelkom-pwt.sch.id';
  const staffDomain = process.env.HADIR_STAFF_EMAIL_DOMAIN || 'smktelkom-pwt.sch.id';
  const parentDomain = process.env.HADIR_PARENT_EMAIL_DOMAIN || 'parent.smktelkom-pwt.sch.id';

  if (role === 'siswa') return `${clean}@${studentDomain}`;
  if (role === 'orang_tua') return `${clean}@${parentDomain}`;
  if (role === 'admin' && clean === 'admin') return `admin@${staffDomain}`;
  return `${clean}@${staffDomain}`;
}

export function getJakartaNow() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const hour = parts.hour === '24' ? '00' : parts.hour;
  const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
  const hhmm = `${hour}:${parts.minute}`;
  const hhmmss = `${hour}:${parts.minute}:${parts.second}`;
  const hari = DAY_MAP[parts.weekday] || 'Senin';
  const isWeekend = hari === 'Sabtu' || hari === 'Minggu';

  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  const yesterdayStr = d.toISOString().slice(0, 10);

  return {
    dateStr,
    yesterdayStr,
    hhmm,
    hhmmss,
    hari,
    isWeekend,
    dayIndex: DAY_INDEX[hari] || 1,
    minutesSinceMidnight: Number(hour) * 60 + Number(parts.minute),
  };
}

export function getDayIndex(hari) {
  return DAY_INDEX[hari] || 1;
}

export function formatIndoDate(dateInput) {
  const str = typeof dateInput === 'string' ? dateInput.slice(0, 10) : new Date(dateInput).toISOString().slice(0, 10);
  const d = new Date(`${str}T12:00:00Z`);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatShortIndoDate(dateInput) {
  const str = typeof dateInput === 'string' ? dateInput.slice(0, 10) : new Date(dateInput).toISOString().slice(0, 10);
  const d = new Date(`${str}T12:00:00Z`);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function calculateBintang(poin) {
  if (poin >= 95) return 5.0;
  if (poin >= 85) return 4.0;
  if (poin >= 75) return 3.0;
  return 2.0;
}

export function getPredikat(bintang) {
  const val = Number(bintang);
  if (val >= 5.0) return 'Sangat Baik (A)';
  if (val >= 4.0) return 'Baik (B)';
  if (val >= 3.0) return 'Cukup (C)';
  return 'Perlu Pembinaan (D)';
}

export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000.0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export function buildAttendanceNotification(user, subject, presensiToday, jakartaNow) {
  const deadline = ATTENDANCE_CONFIG.checkInDeadline;
  const warningMinutes = ATTENDANCE_CONFIG.warningMinutesBefore;

  if (presensiToday) {
    return {
      tampilkan: false,
      sudah_presensi: true,
      batas_waktu: `${deadline} WIB`,
      warning_minutes_before: warningMinutes,
      sisa_menit: 0,
      urgensi: 'done',
      badge: 'Sudah Absen',
      judul: 'Presensi Hari Ini Tercatat',
      pesan: `Presensi datang tercatat pukul ${String(presensiToday.jam_datang || '').slice(0, 5)} WIB.`,
    };
  }

  if (jakartaNow.isWeekend) {
    return {
      tampilkan: false,
      sudah_presensi: false,
      batas_waktu: `${deadline} WIB`,
      warning_minutes_before: warningMinutes,
      sisa_menit: 0,
      urgensi: 'info',
      badge: 'Libur',
      judul: 'Akhir Pekan Libur',
      pesan: 'Tidak ada jadwal presensi pada akhir pekan.',
    };
  }

  const [dh, dm] = deadline.split(':').map(Number);
  const deadlineMinutes = dh * 60 + dm;
  const minutesLeft = deadlineMinutes - jakartaNow.minutesSinceMidnight;
  const isOrangTua = user.role === 'orang_tua';

  let judul;
  let pesan;
  let badge;
  let urgensi;

  if (minutesLeft > 0 && minutesLeft <= warningMinutes) {
    judul = isOrangTua
      ? `Peringatan Absen Anak (${subject.nama_lengkap})`
      : 'Peringatan Batas Waktu Absen!';
    pesan = isOrangTua
      ? `Batas waktu absen ${subject.nama_lengkap} tinggal ${minutesLeft} menit lagi (${deadline} WIB). Pastikan anak segera scan QR di sekolah.`
      : `Batas waktu absen tinggal ${minutesLeft} menit lagi (pukul ${deadline} WIB)! Segera lakukan Scan QR di kawasan SMK Telkom Purwokerto agar poin kedisiplinan tetap 100.`;
    badge = `Tinggal ${minutesLeft} Menit`;
    urgensi = 'high';
  } else if (minutesLeft <= 0) {
    judul = isOrangTua
      ? `Anak Belum Absen (${subject.nama_lengkap})`
      : 'Segera Lakukan Presensi QR!';
    pesan = isOrangTua
      ? `${subject.nama_lengkap} belum melakukan scan QR datang hari ini (batas tepat waktu ${deadline} WIB, pengingat H-${warningMinutes} menit).`
      : `Kamu belum melakukan absen hari ini! Batas waktu tepat waktu pukul ${deadline} WIB (pengingat otomatis ${warningMinutes} menit sebelum batas). Segera scan QR sekarang.`;
    badge = 'Belum Absen';
    urgensi = 'high';
  } else {
    judul = isOrangTua ? 'Pengingat Presensi Anak' : 'Pengingat Batas Waktu Absen';
    pesan = isOrangTua
      ? `${subject.nama_lengkap} belum scan QR datang hari ini. Batas waktu pukul ${deadline} WIB.`
      : `Batas waktu absen tepat waktu pukul ${deadline} WIB (tersisa ${minutesLeft} menit). Pengingat otomatis aktif ${warningMinutes} menit sebelum batas.`;
    badge = `H-${minutesLeft} Menit`;
    urgensi = 'warning';
  }

  return {
    tampilkan: true,
    sudah_presensi: false,
    batas_waktu: `${deadline} WIB`,
    warning_minutes_before: warningMinutes,
    sisa_menit: Math.max(0, minutesLeft),
    urgensi,
    badge,
    judul,
    pesan,
  };
}
