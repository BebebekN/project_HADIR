import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Coffee,
  Circle,
} from 'lucide-react';
import { jadwalApi, presensiApi } from '../services/api';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const CLASSES = ['XI PPLG 4'];

export default function JadwalPage({ user }) {
  const [selectedKelas, setSelectedKelas] = useState(user?.kelas || 'XI PPLG 4');
  const [activeDay, setActiveDay] = useState('Senin');
  const [jadwalData, setJadwalData] = useState(null);
  const [todayPresensi, setTodayPresensi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      jadwalApi.get(selectedKelas),
      presensiApi.today().catch(() => null),
    ])
      .then(([jadwalRes, presensiRes]) => {
        if (cancelled) return;
        if (jadwalRes.success) {
          setJadwalData(jadwalRes.data);
          if (DAYS.includes(jadwalRes.data.hari_ini)) {
            setActiveDay(jadwalRes.data.hari_ini);
          }
        }
        if (presensiRes?.success) {
          setTodayPresensi(presensiRes.data);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedKelas]);

  const activeDayList = jadwalData?.jadwal_mingguan?.[activeDay] || [];
  const isWeekend = jadwalData?.is_weekend;

  return (
    <div className="p-5 sm:p-10 pb-28 lg:pb-10 space-y-8">
      {/* Top Info & Day Selector Bar (Figma #F0F0FF Rounded 24px) */}
      <div className="bg-[#f0f0ff] rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Day Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {DAYS.map((day) => {
            const isSelected = day === activeDay;
            const isToday = day === jadwalData?.hari_ini;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-5 py-2.5 rounded-full text-[12px] font-semibold tracking-[0.2px] transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0055ff] text-white shadow-sm'
                    : 'text-[#5d6367] hover:bg-white/70 hover:text-[#1b1b23]'
                }`}
              >
                <span>{day}</span>
                {isToday && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-[#0055ff]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Datang / Pulang Pill + Kelas Switcher */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          <div className="bg-white rounded-full px-5 py-2.5 shadow-xs flex items-center gap-5 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-[#5d6367] font-medium">Datang:</span>
              <span className="font-mono font-bold text-[#1b1b23]">
                {todayPresensi?.jam_datang?.replace(' WIB', '') || '--:--'}
              </span>
            </div>
            <div className="w-px h-4 bg-[#e3e1ec]" />
            <div className="flex items-center gap-2">
              <span className="text-[#5d6367] font-medium">Pulang:</span>
              <span className="font-mono font-bold text-[#5d6367]">
                {todayPresensi?.jam_pulang?.replace(' WIB', '') || '--:--'}
              </span>
            </div>
          </div>

          <select
            value={selectedKelas}
            onChange={(e) => {
              setLoading(true);
              setSelectedKelas(e.target.value);
            }}
            className="bg-white border border-[#e3e1ec] rounded-full px-4 py-2.5 text-[12px] font-semibold text-[#1b1b23] focus:outline-none focus:ring-2 focus:ring-[#0055ff]"
          >
            {CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekend Holiday Notice */}
      {isWeekend && (
        <div className="bg-white rounded-[24px] p-6 border border-[#ffead5] flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#ffead5] text-[#9a3412] flex items-center justify-center shrink-0">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#1b1b23]">
              Libur Akhir Pekan ({jadwalData?.hari_ini})
            </h3>
            <p className="text-[13px] text-[#5d6367]">
              {jadwalData?.pesan_libur ||
                'Hari ini akhir pekan. Anda tetap dapat melihat jadwal pelajaran Senin–Jumat di atas.'}
            </p>
          </div>
        </div>
      )}

      {/* Timeline Schedule Cards (Figma Section - Daftar Mata Pelajaran) */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-9 h-9 border-4 border-[#0055ff] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : activeDayList.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 border border-[#e3e1ec]/50 text-center">
          <Coffee className="w-12 h-12 text-[#94a3b8] mx-auto mb-3" />
          <h3 className="font-semibold text-[#1b1b23] text-base">
            Tidak Ada Jadwal
          </h3>
          <p className="text-xs text-[#5d6367] mt-1">
            Belum ada jadwal pelajaran pada hari {activeDay} untuk kelas {selectedKelas}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeDayList.map((item, idx) => {
            const isCompleted = item.centang_hijau || item.status_waktu === 'completed';
            const isOngoing = item.status_waktu === 'ongoing';
            const isBreak = item.nama_kegiatan.toLowerCase().includes('istirahat');
            const isLast = idx === activeDayList.length - 1;

            return (
              <div key={item.id || idx} className="flex gap-4 items-stretch">
                {/* Left Vertical Timeline Rail (Matching Figma Mobile & Real-Time Indicator) */}
                <div className="flex flex-col items-center pt-6 shrink-0">
                  {isCompleted ? (
                    <div
                      title="Selesai (Centang Hijau Real-Time)"
                      className="w-6 h-6 rounded-full bg-[#135e3d] text-white flex items-center justify-center shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  ) : isOngoing ? (
                    <div
                      title="Sedang Berlangsung"
                      className="w-6 h-6 rounded-full border-2 border-[#0055ff] bg-white flex items-center justify-center"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0055ff] animate-pulse" />
                    </div>
                  ) : (
                    <div
                      title="Belum Berlangsung"
                      className="w-6 h-6 rounded-full bg-white border-2 border-[#cbd5e1] flex items-center justify-center text-[#94a3b8]"
                    >
                      <Circle className="w-2.5 h-2.5" />
                    </div>
                  )}

                  {!isLast && (
                    <div className="w-[2px] flex-1 bg-[#e3e1ec] my-1.5" />
                  )}
                </div>

                {/* Subject Card */}
                <div
                  className={`flex-1 rounded-[24px] p-5 sm:p-6 border shadow-xs transition-all ${
                    isBreak
                      ? 'bg-[#f8f8fd] border-[#e3e1ec]/80'
                      : isOngoing
                      ? 'bg-white border-[#0055ff]/40 ring-2 ring-[#0055ff]/10'
                      : isCompleted
                      ? 'bg-white border-[#ddf8eb]'
                      : 'bg-white border-[#e3e1ec]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3
                        className={`text-[16px] sm:text-[18px] font-semibold leading-[24px] ${
                          isOngoing ? 'text-[#0055ff]' : 'text-[#1b1b23]'
                        }`}
                      >
                        {item.nama_kegiatan}
                      </h3>
                      <p className="text-[13px] sm:text-[14px] text-[#5d6367]">
                        {item.nama_guru && item.nama_guru !== '-'
                          ? item.nama_guru
                          : 'Waktu Istirahat Sekolah'}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.2px] shrink-0 ${
                        isCompleted
                          ? 'bg-[#ddf8eb] text-[#135e3d]'
                          : isOngoing
                          ? 'bg-[#0055ff] text-white'
                          : isWeekend
                          ? 'bg-[#ffead5] text-[#9a3412]'
                          : 'bg-[#f8f8fd] text-[#5d6367] border border-[#e3e1ec]'
                      }`}
                    >
                      {isCompleted
                        ? 'Selesai'
                        : isOngoing
                        ? 'Berlangsung'
                        : isWeekend
                        ? 'Libur'
                        : 'Terjadwal'}
                    </span>
                  </div>

                  <div
                    className={`mt-4 flex items-center gap-2 text-[13px] font-mono font-semibold ${
                      isCompleted
                        ? 'text-[#135e3d]'
                        : isOngoing
                        ? 'text-[#0055ff]'
                        : 'text-[#5d6367]'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{item.durasi} WIB</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
