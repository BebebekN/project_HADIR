import React, { useState, useEffect } from 'react';
import { QrCode, Footprints, MapPin, UserCheck, CalendarClock } from 'lucide-react';
import { presensiApi } from '../services/api';

export default function AktivitasPage({ user }) {
  const [todayData, setTodayData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    presensiApi
      .today()
      .then((res) => {
        if (!cancelled && res.success) setTodayData(res.data);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const jamDatang = todayData?.jam_datang || '--:--';
  const jamPulang = todayData?.jam_pulang || '--:--';
  const status = todayData?.status || 'Belum Hadir';
  const riwayat = todayData?.riwayat_terbaru || [];
  const isOrangTua = user?.role === 'orang_tua';
  const anak = todayData?.anak;

  return (
    <div className="p-5 sm:p-10 pb-28 lg:pb-10 space-y-6">
      {isOrangTua && (
        <div className="bg-[#f0f0ff] border border-[#0055ff]/15 rounded-[24px] p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#0055ff] text-white flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#0055ff]">
              Pemantauan Aktivitas Anak (Double NIS)
            </div>
            <div className="text-[15px] font-bold text-[#1b1b23]">
              {anak?.nama_lengkap || user?.child_name} • NIS {anak?.nis_nip || user?.child_nis} (
              {anak?.kelas || user?.kelas})
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4 Cols Summary */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-[24px] p-6 border border-[#e3e1ec]/50 shadow-xs space-y-2">
            <div className="text-[12px] font-medium text-[#5d6367]">
              Keberangkatan &amp; Kedatangan
            </div>
            <div className="text-[24px] font-bold font-mono text-[#1b1b23]">
              06:30 → {jamDatang.replace(' WIB', '')}
            </div>
            <div
              className={`text-[12px] font-medium ${
                status === 'Terlambat' ? 'text-[#be123c]' : 'text-[#135e3d]'
              }`}
            >
              {todayData?.sudah_presensi
                ? `Tercatat di kawasan SMK Telkom Purwokerto (${status})`
                : 'Belum ada scan presensi datang hari ini'}
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#e3e1ec]/50 shadow-xs space-y-2">
            <div className="text-[12px] font-medium text-[#5d6367]">
              Waktu Kepulangan
            </div>
            <div className="text-[24px] font-bold font-mono text-[#5d6367]">
              {jamPulang.replace(' WIB', '')}
            </div>
            <div className="text-[12px] font-medium text-[#9a3412]">
              {todayData?.jam_pulang
                ? 'Presensi kepulangan telah tercatat'
                : 'Jadwal pulang pukul 15:30 - 16:00 WIB'}
            </div>
          </div>
        </div>

        {/* Right 8 Cols: Linimasa + Riwayat Presensi */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#e3e1ec]/50 shadow-xs space-y-5">
            <h2 className="text-[18px] font-semibold text-[#1b1b23]">
              Linimasa Aktivitas Harian
            </h2>

            <div className="space-y-4">
              <div className="bg-[#f8f8fd] rounded-[20px] p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#ddf8eb] text-[#135e3d] flex items-center justify-center shrink-0">
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-[#1b1b23]">
                      Berangkat ke Sekolah
                    </div>
                    <div className="text-[12px] text-[#5d6367]">
                      Persiapan apel pagi &amp; aktivitas pembelajaran.
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <div className="text-[13px] font-mono font-bold text-[#0055ff]">
                    06:30 WIB
                  </div>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-[#ddf8eb] text-[#135e3d] text-[11px] font-semibold">
                    Terjadwal
                  </span>
                </div>
              </div>

              <div className="bg-[#f8f8fd] rounded-[20px] p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                      todayData?.sudah_presensi
                        ? 'bg-[#ddf8eb] text-[#135e3d]'
                        : 'bg-[#f0f0ff] text-[#0055ff]'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-[#1b1b23]">
                      Tiba di Sekolah (Scan QR Datang)
                    </div>
                    <div className="text-[12px] text-[#5d6367]">
                      Validasi QR Admin &amp; lokasi GPS kawasan SMK Telkom Purwokerto.
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <div className="text-[13px] font-mono font-bold text-[#0055ff]">
                    {jamDatang}
                  </div>
                  <span
                    className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold ${
                      status === 'Terlambat'
                        ? 'bg-[#ffe4e6] text-[#be123c]'
                        : status === 'Tepat Waktu'
                        ? 'bg-[#ddf8eb] text-[#135e3d]'
                        : 'bg-white text-[#5d6367]'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              <div className="bg-[#f8f8fd] rounded-[20px] p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                      todayData?.jam_pulang
                        ? 'bg-[#ddf8eb] text-[#135e3d]'
                        : 'bg-[#ffead5] text-[#9a3412]'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-[#1b1b23]">
                      Presensi Kepulangan
                    </div>
                    <div className="text-[12px] text-[#5d6367]">
                      Scan QR saat jam pulang sekolah berakhir.
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <div className="text-[13px] font-mono font-bold text-[#5d6367]">
                    {jamPulang}
                  </div>
                  <span
                    className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold ${
                      todayData?.jam_pulang
                        ? 'bg-[#ddf8eb] text-[#135e3d]'
                        : 'bg-[#ffead5] text-[#9a3412]'
                    }`}
                  >
                    {todayData?.jam_pulang ? 'Selesai' : 'Menunggu'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Riwayat Presensi Terbaru */}
          <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#e3e1ec]/50 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-[#0055ff]" />
              <h2 className="text-[18px] font-semibold text-[#1b1b23]">
                Riwayat Kehadiran Terbaru
              </h2>
            </div>

            {riwayat.length === 0 ? (
              <p className="text-[13px] text-[#5d6367] py-4">
                Belum ada catatan presensi sebelumnya.
              </p>
            ) : (
              <div className="divide-y divide-[#e3e1ec]/60">
                {riwayat.map((item, idx) => (
                  <div
                    key={item.tanggal || idx}
                    className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-[14px] font-semibold text-[#1b1b23]">
                        {item.tanggal_label || item.tanggal}
                      </div>
                      <div className="text-[12px] font-mono text-[#5d6367]">
                        Datang: {item.jam_datang || '--:--'} • Pulang: {item.jam_pulang || '--:--'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                          item.status === 'Tepat Waktu'
                            ? 'bg-[#ddf8eb] text-[#135e3d]'
                            : 'bg-[#ffe4e6] text-[#be123c]'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-[#5d6367]">
                        {item.poin_perubahan < 0 ? `${item.poin_perubahan} poin` : '+0'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
