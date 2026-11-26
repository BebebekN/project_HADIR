import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  LogIn,
  LogOut as LogOutIcon,
  Clock,
  Calendar,
  QrCode,
  Award,
  ChevronLeft,
  ChevronRight,
  Coffee,
  ArrowRight,
  BellRing,
} from 'lucide-react';
import { dashboardApi } from '../services/api';

export default function DashboardSiswa({
  user,
  onNavigate,
  refreshKey,
}) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardApi.siswa();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch {
      setError('Gagal memuat data dashboard. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .siswa()
      .then((res) => {
        if (!cancelled && res.success) {
          setDashboardData(res.data);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Gagal memuat data dashboard. Silakan coba lagi.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0055ff] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs text-[#5d6367] font-medium">
          Memuat data beranda HADIR...
        </p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-6 lg:p-10">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-[24px] text-sm flex items-center justify-between">
          <span>{error || 'Data tidak ditemukan.'}</span>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[#0055ff] text-white rounded-full text-xs font-semibold"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const {
    presensi_hari_ini,
    statistik_kehadiran,
    jadwal_hari_ini,
    notifikasi_presensi,
  } = dashboardData;
  const currentUser = dashboardData.user || user;
  const isOrangTua = currentUser?.role === 'orang_tua';
  const isWeekend = jadwal_hari_ini?.is_weekend;
  const sudahHadir = presensi_hari_ini?.sudah_presensi;

  return (
    <div className="p-5 sm:p-10 pb-28 lg:pb-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT 8 COLS */}
      <div className="lg:col-span-8 space-y-8">
        {!sudahHadir && !isWeekend && notifikasi_presensi?.tampilkan && (
          <div className="bg-[#fff7ed] border border-[#fdba74] rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-[#ffead5] text-[#9a3412] flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-bold text-[#9a3412]">
                    {notifikasi_presensi.judul || 'Peringatan Batas Waktu Absen!'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ffe4e6] text-[#be123c] text-[11px] font-bold">
                    {notifikasi_presensi.badge || '10 Menit Lagi'}
                  </span>
                </div>
                <p className="text-[12px] text-[#7c2d12] leading-relaxed">
                  {notifikasi_presensi.pesan}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate(isOrangTua ? 'aktivitas' : 'presensi')}
              className="px-5 py-2.5 rounded-full bg-[#0055ff] hover:bg-[#0044cc] text-white text-[12px] font-semibold shrink-0 transition-all"
            >
              {isOrangTua ? 'Pantau Aktivitas' : 'Scan QR Sekarang'}
            </button>
          </div>
        )}

        {/* Ringkasan Kehadiran Hari Ini (#F0F0FF Rounded 24px Card) */}
        <section className="bg-[#f0f0ff] rounded-[24px] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-semibold text-[#0055ff] leading-[26px]">
                {isOrangTua
                  ? `Kehadiran Anak (${currentUser.child_name || 'Siswa'})`
                  : 'Ringkasan Kehadiran Hari Ini'}
              </h2>
              <p className="text-[14px] text-[#5d6367] leading-[20px]">
                {isOrangTua
                  ? `Pantauan status presensi real-time kelas ${currentUser.kelas || 'XI PPLG 4'} (NIS: ${currentUser.child_nis || '-'})`
                  : 'Status presensi gerbang sekolah tercatat otomatis'}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold tracking-[0.2px] ${
                sudahHadir
                  ? presensi_hari_ini.status === 'Terlambat'
                    ? 'bg-[#ffe4e6] text-[#be123c]'
                    : 'bg-[#ddf8eb] text-[#135e3d]'
                  : 'bg-white text-[#5d6367]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {sudahHadir ? 'Hadir' : 'Belum Hadir'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Presensi Datang */}
            <div
              onClick={() => onNavigate(isOrangTua ? 'aktivitas' : 'presensi')}
              className="bg-white rounded-[24px] p-6 shadow-xs flex items-center justify-between cursor-pointer hover:ring-2 hover:ring-[#0055ff]/20 transition-all"
            >
              <div className="space-y-1">
                <div className="text-[12px] font-semibold text-[#5d6367] tracking-[0.2px]">
                  Presensi Datang
                </div>
                <div className="text-[24px] font-bold font-mono text-[#1b1b23] tracking-[-0.2px]">
                  {presensi_hari_ini.jam_datang || '--:--'}
                </div>
                <div
                  className={`text-[11px] font-medium ${
                    presensi_hari_ini.status === 'Terlambat'
                      ? 'text-[#be123c]'
                      : presensi_hari_ini.status === 'Tepat Waktu'
                      ? 'text-[#135e3d]'
                      : 'text-[#5d6367]'
                  }`}
                >
                  {presensi_hari_ini.status || 'Belum Presensi'}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#ddf8eb] text-[#135e3d] flex items-center justify-center shrink-0">
                <LogIn className="w-5 h-5" />
              </div>
            </div>

            {/* Presensi Pulang */}
            <div
              onClick={() => onNavigate(isOrangTua ? 'aktivitas' : 'presensi')}
              className="bg-white rounded-[24px] p-6 shadow-xs flex items-center justify-between cursor-pointer hover:ring-2 hover:ring-[#0055ff]/20 transition-all"
            >
              <div className="space-y-1">
                <div className="text-[12px] font-semibold text-[#5d6367] tracking-[0.2px]">
                  Presensi Pulang
                </div>
                <div className="text-[24px] font-bold font-mono text-[#5d6367] tracking-[-0.2px]">
                  {presensi_hari_ini.jam_pulang || '--:--'}
                </div>
                <div
                  className={`text-[11px] font-medium ${
                    presensi_hari_ini.jam_pulang ? 'text-[#135e3d]' : 'text-[#9a3412]'
                  }`}
                >
                  {presensi_hari_ini.jam_pulang ? 'Sudah Pulang' : 'Belum Scan'}
                </div>
              </div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  presensi_hari_ini.jam_pulang
                    ? 'bg-[#ddf8eb] text-[#135e3d]'
                    : 'bg-[#ffead5] text-[#9a3412]'
                }`}
              >
                <LogOutIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Jadwal Pelajaran Hari Ini (Smooth Slide Carousel) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[18px] font-semibold text-[#1b1b23]">
              Jadwal Pelajaran Hari Ini ({jadwal_hari_ini?.hari})
            </h2>

            <div className="flex items-center gap-2">
              {!isWeekend && jadwal_hari_ini?.items?.length > 0 && (
                <div className="flex items-center gap-1 mr-1">
                  <button
                    type="button"
                    onClick={() => scrollCarousel('left')}
                    aria-label="Geser Kiri"
                    className="w-8 h-8 rounded-full bg-white border border-[#e3e1ec] hover:bg-[#f0f0ff] text-[#5d6367] flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel('right')}
                    aria-label="Geser Kanan"
                    className="w-8 h-8 rounded-full bg-white border border-[#e3e1ec] hover:bg-[#f0f0ff] text-[#5d6367] flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => onNavigate('jadwal')}
                className="text-[12px] font-semibold text-[#0055ff] hover:underline tracking-[0.2px]"
              >
                Lihat Jadwal Lengkap
              </button>
            </div>
          </div>

          {isWeekend ? (
            <div className="bg-white rounded-[24px] p-8 border border-[#e3e1ec]/70 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#ffead5] text-[#9a3412] flex items-center justify-center mx-auto">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#1b1b23]">
                Libur Akhir Pekan
              </h3>
              <p className="text-[13px] text-[#5d6367] max-w-md mx-auto">
                {jadwal_hari_ini?.pesan_libur ||
                  'Tidak ada kegiatan belajar mengajar pada hari Sabtu dan Minggu. Selamat beristirahat!'}
              </p>
            </div>
          ) : jadwal_hari_ini?.items?.length === 0 ? (
            <div className="bg-white rounded-[24px] p-8 border border-[#e3e1ec]/70 text-center text-sm text-[#5d6367]">
              Belum ada jadwal pelajaran untuk hari ini.
            </div>
          ) : (
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 scrollbar-none"
            >
              {jadwal_hari_ini.items.map((item, idx) => {
                const isCompleted = item.centang_hijau || item.status_waktu === 'completed';
                const isOngoing = item.status_waktu === 'ongoing';

                return (
                  <div
                    key={item.id || idx}
                    onClick={() => onNavigate('jadwal')}
                    className={`min-w-[280px] sm:min-w-[302px] snap-start bg-white rounded-[24px] p-6 border shadow-xs cursor-pointer transition-all hover:shadow-md space-y-4 ${
                      isCompleted
                        ? 'border-[#ddf8eb]'
                        : isOngoing
                        ? 'border-[#0055ff]/40 ring-2 ring-[#0055ff]/10'
                        : 'border-[#e3e1ec]/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-[16px] font-semibold text-[#1b1b23] leading-[22px] truncate">
                          {item.nama_kegiatan}
                        </h3>
                        <p className="text-[12px] text-[#5d6367] mt-0.5 truncate">
                          {item.nama_guru && item.nama_guru !== '-'
                            ? item.nama_guru
                            : 'Jam Istirahat / Kegiatan'}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-medium shrink-0 ${
                          isCompleted
                            ? 'bg-[#ddf8eb] text-[#135e3d]'
                            : isOngoing
                            ? 'bg-[#0055ff] text-white'
                            : 'bg-[#ffead5] text-[#9a3412]'
                        }`}
                      >
                        {isCompleted ? 'Selesai' : isOngoing ? 'Berlangsung' : 'Berikutnya'}
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 text-[12px] font-mono font-semibold ${
                        isCompleted
                          ? 'text-[#135e3d]'
                          : isOngoing
                          ? 'text-[#0055ff]'
                          : 'text-[#5d6367]'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#135e3d]" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>{item.durasi} WIB</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* RIGHT 4 COLS */}
      <div className="lg:col-span-4 space-y-6">
        {/* Akses Cepat Card */}
        <section className="bg-white rounded-[24px] p-6 border border-[#e3e1ec]/50 shadow-xs space-y-4">
          <h2 className="text-[16px] font-semibold text-[#1b1b23]">Akses Cepat</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onNavigate('jadwal')}
              className="bg-[#f8f8fd] hover:bg-[#f0f0ff] border border-[#e3e1ec]/50 rounded-[24px] p-3 flex flex-col items-center gap-2 transition-all"
            >
              <div className="w-12 h-12 rounded-[20px] bg-[#f0f0ff] text-[#0055ff] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[12px] font-semibold text-[#1b1b23]">Jadwal</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('rapot')}
              className="bg-[#f8f8fd] hover:bg-[#f0f0ff] border border-[#e3e1ec]/50 rounded-[24px] p-3 flex flex-col items-center gap-2 transition-all"
            >
              <div className="w-12 h-12 rounded-[20px] bg-[#ddf8eb] text-[#135e3d] flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[12px] font-semibold text-[#1b1b23]">Nilai</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate(isOrangTua ? 'aktivitas' : 'presensi')}
              className="bg-[#f8f8fd] hover:bg-[#f0f0ff] border border-[#e3e1ec]/50 rounded-[24px] p-3 flex flex-col items-center gap-2 transition-all"
            >
              <div className="w-12 h-12 rounded-[20px] bg-[#e2e3f7] text-[#0055ff] flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-[12px] font-semibold text-[#1b1b23]">
                {isOrangTua ? 'Aktivitas' : 'Presensi'}
              </span>
            </button>
          </div>
        </section>

        {/* Nilai Kedisiplinan Blue Card (#0055FF) */}
        <section
          onClick={() => onNavigate('rapot')}
          className="bg-[#0055ff] hover:bg-[#004ce6] transition-all cursor-pointer rounded-[24px] p-6 text-white shadow-md space-y-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-white/90">
              Nilai Kedisiplinan
            </span>
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-white">
              Detail Rekap <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white text-[#0055ff] font-bold font-mono text-[22px] flex items-center justify-center shrink-0 shadow-sm">
              {currentUser.poin_kedisiplinan}
            </div>
            <div className="min-w-0">
              <div className="text-[20px] font-bold leading-tight">
                {currentUser.predikat?.split(' ')[0] === 'Sangat'
                  ? 'Sangat Baik'
                  : currentUser.predikat || 'Sangat Baik'}
              </div>
              <div className="text-[12px] text-white/85 mt-1">
                Kehadiran {statistik_kehadiran?.persentase_kedisiplinan || '100%'} •{' '}
                {statistik_kehadiran?.terlambat ?? 0} Terlambat
              </div>
              <div className="text-[12px] font-semibold text-amber-300 mt-1">
                ★ {Number(currentUser.bintang).toFixed(1)} / 5.0 Bintang PKL
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
