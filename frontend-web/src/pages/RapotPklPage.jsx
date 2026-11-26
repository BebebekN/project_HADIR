import React, { useState, useEffect } from 'react';
import { Star, Plane, Printer } from 'lucide-react';
import { dashboardApi } from '../services/api';

export default function RapotPklPage({ user, refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [academicYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .siswa()
      .then((res) => {
        if (!cancelled && res.success) setData(res.data);
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-9 h-9 border-4 border-[#0055ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const u = data?.user || user;
  const stats = data?.statistik_kehadiran || {
    total_kehadiran: 0,
    tepat_waktu: 0,
    terlambat: 0,
    persentase_kedisiplinan: '100%',
  };
  const bintang = Number(u?.bintang ?? 5.0);
  const filledStars = Math.round(bintang);
  const poin = u?.poin_kedisiplinan ?? 100;

  const kelayakan =
    bintang >= 5.0
      ? {
          badge: 'Lolos PKL Luar Kota',
          headline: '5 / 5 Bintang • Kehadiran Sempurna',
          desc: 'Kedisiplinan sangat baik tanpa keterlambatan berlebih. Memenuhi syarat penempatan PKL di luar kota.',
        }
      : bintang >= 3.0
      ? {
          badge: 'Evaluasi Pembina',
          headline: `${bintang.toFixed(1)} / 5 Bintang • Perlu Perhatian`,
          desc: 'Terdapat beberapa catatan keterlambatan. Tingkatkan ketepatan waktu sebelum pukul 07:00 WIB.',
        }
      : {
          badge: 'PKL di Sekolah',
          headline: `${bintang.toFixed(1)} / 5 Bintang • Pembinaan Khusus`,
          desc: 'Poin kedisiplinan di bawah standar minimal. Diperlukan pembinaan wali kelas dan guru PKL.',
        };

  return (
    <div className="p-5 sm:p-10 pb-28 lg:pb-10 space-y-8">
      {/* Top Row: Hero Blue Card (6 cols) + 3 Metrics (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Hero Rapot Card (#0055FF) */}
        <div className="lg:col-span-6 bg-[#0055ff] rounded-[24px] p-7 sm:p-8 text-white shadow-md space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[12px] font-semibold text-[#e2e3f7]">
                SMK Telkom Purwokerto {academicYear}/{academicYear + 1} • Wali Kelas: Firda Ayu Nirmala, S.Kom
              </div>
              <h2 className="text-[18px] font-semibold mt-1">
                {u?.nama_lengkap} • {u?.kelas || 'Siswa'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              title="Cetak Rapot"
              className="p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all print:hidden"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white/10 rounded-[24px] p-6 space-y-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((idx) => (
                <Star
                  key={idx}
                  className={`w-7 h-7 ${
                    idx <= filledStars
                      ? 'fill-white text-white'
                      : 'text-white/35'
                  }`}
                />
              ))}
            </div>

            <div className="text-[18px] font-semibold">{kelayakan.headline}</div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ddf8eb] text-[#135e3d] text-[12px] font-semibold">
              <Plane className="w-4 h-4" />
              <span>{kelayakan.badge}</span>
            </div>

            <p className="text-[13px] text-white/90 leading-[20px]">
              {kelayakan.desc}
            </p>
          </div>
        </div>

        {/* 3 Tall Metric Cards */}
        <div className="lg:col-span-6 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-[24px] p-6 border border-[#e3e1ec]/50 shadow-xs flex flex-col justify-between min-h-[220px]">
            <div className="text-[12px] font-semibold text-[#135e3d]">
              Kedisiplinan
            </div>
            <div className="text-[32px] sm:text-[36px] font-bold text-[#1b1b23] tracking-[-0.5px]">
              {stats.persentase_kedisiplinan}
            </div>
            <div className="text-[12px] text-[#135e3d]">
              {stats.tepat_waktu}x Tepat Waktu
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#e3e1ec]/50 shadow-xs flex flex-col justify-between min-h-[220px]">
            <div className="text-[12px] font-semibold text-[#9a3412]">
              Terlambat
            </div>
            <div className="text-[32px] sm:text-[36px] font-bold text-[#1b1b23] tracking-[-0.5px]">
              {stats.terlambat}
            </div>
            <div className="text-[12px] text-[#5d6367]">
              -5 poin per kejadian
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#e3e1ec]/50 shadow-xs flex flex-col justify-between min-h-[220px]">
            <div className="text-[12px] font-semibold text-[#0055ff]">
              Poin PKL
            </div>
            <div className="text-[32px] sm:text-[36px] font-bold text-[#1b1b23] tracking-[-0.5px]">
              {poin}
            </div>
            <div className="text-[12px] text-[#5d6367]">Dari 100 poin</div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Ketentuan Rapot + Riwayat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 sm:p-7 border border-[#e3e1ec]/50 shadow-xs space-y-4">
          <h3 className="text-[16px] font-semibold text-[#1b1b23]">
            Ketentuan Rapot &amp; Penempatan PKL
          </h3>

          <div className="space-y-3">
            <div className="bg-[#f8f8fd] rounded-[20px] p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-semibold text-[#135e3d]">
                  ★★★★★ (5 Bintang • Poin 95–100)
                </div>
                <div className="text-[12px] text-[#5d6367] mt-0.5">
                  Hadir rutin sebelum pukul 07:00 WIB tanpa keterlambatan berarti.
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-white text-[#135e3d] text-[11px] font-semibold border border-[#e3e1ec]/60 shrink-0">
                Lolos PKL Luar Kota
              </span>
            </div>

            <div className="bg-[#f8f8fd] rounded-[20px] p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-semibold text-[#135e3d]">
                  ★★★★☆ / ★★★☆☆ (3–4 Bintang • Poin 75–94)
                </div>
                <div className="text-[12px] text-[#5d6367] mt-0.5">
                  Terdapat keterlambatan 1–5 kali pada periode berjalan.
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-white text-[#9a3412] text-[11px] font-semibold border border-[#e3e1ec]/60 shrink-0">
                Evaluasi Pembina
              </span>
            </div>

            <div className="bg-[#f8f8fd] rounded-[20px] p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-semibold text-[#135e3d]">
                  ★★☆☆☆ (1–2 Bintang • Poin &lt; 75)
                </div>
                <div className="text-[12px] text-[#5d6367] mt-0.5">
                  Sering terlambat lewat 07:00 WIB atau akumulasi pelanggaran poin.
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-white text-[#be123c] text-[11px] font-semibold border border-[#e3e1ec]/60 shrink-0">
                PKL di Sekolah
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-[24px] p-6 sm:p-7 border border-[#e3e1ec]/50 shadow-xs space-y-4">
          <h3 className="text-[16px] font-semibold text-[#1b1b23]">
            Ringkasan Evaluasi
          </h3>

          <div className="space-y-3">
            <div className="bg-[#f8f8fd] rounded-[20px] p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold text-[#1b1b23]">
                  Periode Berjalan
                </div>
                <div className="text-[12px] text-[#5d6367]">
                  {stats.total_kehadiran} Hari Hadir • {stats.terlambat} Terlambat • {bintang.toFixed(1)}★
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#ddf8eb] text-[#135e3d] text-[11px] font-semibold shrink-0">
                {kelayakan.badge}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
