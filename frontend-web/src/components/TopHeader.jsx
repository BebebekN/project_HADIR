import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle2, QrCode, X } from 'lucide-react';
import HadirLogo from './HadirLogo';

function formatTodayIndo() {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export default function TopHeader({
  user,
  activeTab,
  onOpenRapot,
  onNavigate,
  notification,
}) {
  const [todayFormatted] = useState(formatTodayIndo);
  const [notifOpen, setNotifOpen] = useState(false);
  const [samplePreview, setSamplePreview] = useState(false);

  const isOrangTua = user?.role === 'orang_tua';
  const isGuruOrAdmin = user?.role === 'guru' || user?.role === 'admin';
  const hasUnreadAlert = !isGuruOrAdmin && (notification?.tampilkan || samplePreview);

  const handleTriggerSampleNotif = () => {
    setSamplePreview(true);
    setNotifOpen(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('HADIR • Batas Waktu Absen 10 Menit Lagi!', {
          body: 'Peringatan untuk siswa: batas waktu absen tinggal 10 menit lagi (07:00 WIB). Segera scan QR di SMK Telkom Purwokerto.',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification('HADIR • Batas Waktu Absen 10 Menit Lagi!', {
              body: 'Peringatan untuk siswa: batas waktu absen tinggal 10 menit lagi (07:00 WIB). Segera scan QR di SMK Telkom Purwokerto.',
            });
          }
        });
      }
    }
  };

  const headerInfo = {
    dashboard: {
      eyebrow: isOrangTua
        ? `Mode Orang Tua • Memantau ${user?.child_name || 'Siswa'} (${user?.child_nis || ''})`
        : 'Selamat Datang,',
      title: user?.nama_lengkap || 'Siswa',
      pillPrimary: false,
    },
    jadwal: {
      eyebrow: null,
      title: isOrangTua ? `Jadwal Pelajaran ${user?.child_name || 'Anak'}` : 'Jadwal Pelajaran',
      subtitle: `${user?.kelas || 'XI PPLG 4'} • SMK Telkom Purwokerto (Rekayasa Perangkat Lunak)`,
      pillPrimary: true,
    },
    presensi: {
      eyebrow: null,
      title: 'Presensi QR',
      subtitle: todayFormatted,
      pillPrimary: false,
    },
    aktivitas: {
      eyebrow: null,
      title: isOrangTua ? `Aktivitas Harian ${user?.child_name || 'Anak'}` : 'Aktivitas Siswa',
      subtitle: isOrangTua
        ? `Pantauan keberangkatan, kehadiran sekolah & riwayat presensi ${user?.child_name || 'anak'}`
        : 'Pemantauan keberangkatan, kedatangan, kegiatan sekolah, dan kepulangan',
      pillPrimary: false,
    },
    rapot: {
      eyebrow: null,
      title: isOrangTua ? `Rapot Kedisiplinan ${user?.child_name || 'Anak'}` : 'Rapot Kehadiran & Kelayakan PKL',
      subtitle: 'Evaluasi bintang kehadiran untuk penentuan penempatan PKL siswa',
      pillPrimary: false,
    },
    monitoring: {
      eyebrow: null,
      title: 'Monitoring Guru & Rapor PKL',
      subtitle: 'Rekap kehadiran harian dan kedisiplinan siswa XI PPLG 4',
      pillPrimary: true,
    },
    profil: {
      eyebrow: null,
      title: 'Profil Pengguna',
      subtitle: `${user?.nis_nip} • ${user?.kelas || user?.role}`,
      pillPrimary: false,
    },
  }[activeTab] || {
    eyebrow: 'Selamat Datang,',
    title: user?.nama_lengkap || 'Pengguna',
    pillPrimary: false,
  };

  return (
    <header className="bg-white border-b border-[#e3e1ec]/50 px-5 sm:px-10 py-5 flex items-center justify-between gap-4 print:hidden">
      <div className="flex items-center gap-3 min-w-0">
        <div className="lg:hidden shrink-0">
          <HadirLogo variant="squircle" showWordmark={false} />
        </div>
        <div className="min-w-0">
          {headerInfo.eyebrow && (
            <p className="text-[12px] text-[#5d6367] leading-[18px]">
              {headerInfo.eyebrow}
            </p>
          )}
          <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1b1b23] tracking-[-0.2px] leading-[30px] truncate">
            {headerInfo.title}
          </h1>
          {headerInfo.subtitle && (
            <p className="text-[12px] text-[#5d6367] leading-[18px] truncate">
              {headerInfo.subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 relative">
        <div
          className={`hidden sm:block px-4 py-2 rounded-full text-[12px] font-semibold tracking-[0.2px] ${
            headerInfo.pillPrimary
              ? 'bg-[#0055ff] text-white'
              : 'bg-[#f0f0ff] text-[#0055ff]'
          }`}
        >
          {todayFormatted}
        </div>

        <button
          type="button"
          onClick={() => setNotifOpen((prev) => !prev)}
          title="Notifikasi HADIR"
          className="relative w-11 h-11 rounded-full bg-[#f0f0ff] hover:bg-[#e3e5ff] flex items-center justify-center text-[#0055ff] transition-all"
        >
          <Bell className="w-5 h-5" />
          {hasUnreadAlert && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#dc2626] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              1
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white rounded-[24px] shadow-xl border border-[#e3e1ec] p-5 z-50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[#1b1b23]">
                  Notifikasi HADIR
                </span>
                {hasUnreadAlert && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ffe4e6] text-[#be123c] text-[10px] font-bold">
                    Penting
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setNotifOpen(false)}
                className="text-[#5d6367] hover:text-[#1b1b23]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {samplePreview ? (
              <div className="bg-[#fff7ed] border border-[#fdba74] rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#9a3412] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#dc2626]" />
                    Batas Waktu Absen 10 Menit Lagi!
                  </span>
                  <span className="text-[10px] font-bold text-[#dc2626]">
                    H-10m
                  </span>
                </div>
                <p className="text-[12px] text-[#7c2d12] leading-relaxed">
                  Peringatan untuk siswa agar segera absen, karena batas waktu absen tinggal 10 menit lagi (pukul 07:00 WIB) di kawasan SMK Telkom Purwokerto.
                </p>
              </div>
            ) : notification?.tampilkan && !isGuruOrAdmin ? (
              <div className="bg-[#fff7ed] border border-[#fdba74] rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-[#9a3412] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0" />
                    {notification.judul || 'Peringatan Batas Waktu Absen'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ffe4e6] text-[#be123c] text-[10px] font-bold shrink-0">
                    {notification.badge || '10 Menit Lagi'}
                  </span>
                </div>
                <p className="text-[12px] text-[#7c2d12] leading-relaxed">
                  {notification.pesan}
                </p>
              </div>
            ) : (
              <div className="bg-[#f8f8fd] rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#135e3d] shrink-0 mt-0.5" />
                <div className="text-[12px] text-[#5d6367] leading-relaxed">
                  {notification?.sudah_presensi
                    ? notification.pesan
                    : 'Pengingat presensi H-10 menit sebelum 07:00 WIB aktif untuk memantau kedisiplinan siswa XI PPLG 4.'}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(false);
                  if (isGuruOrAdmin) {
                    onOpenRapot?.();
                  } else {
                    onNavigate?.(isOrangTua ? 'aktivitas' : 'presensi');
                  }
                }}
                className="flex-1 py-2.5 px-3 rounded-full bg-[#0055ff] hover:bg-[#0044cc] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>
                  {isGuruOrAdmin
                    ? 'Monitoring Kelas'
                    : isOrangTua
                    ? 'Aktivitas Anak'
                    : 'Scan QR Sekarang'}
                </span>
              </button>
              {!isGuruOrAdmin && (
                <button
                  type="button"
                  onClick={handleTriggerSampleNotif}
                  className="py-2.5 px-3 rounded-full bg-[#fff7ed] border border-[#fdba74] hover:bg-[#ffead5] text-[#9a3412] text-[11px] font-semibold transition-all"
                >
                  Simulasi 10m
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
