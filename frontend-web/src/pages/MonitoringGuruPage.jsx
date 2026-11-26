import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Search,
} from 'lucide-react';
import { dashboardApi } from '../services/api';

const CLASSES = ['XI PPLG 4'];

export default function MonitoringGuruPage() {
  const [selectedKelas, setSelectedKelas] = useState('XI PPLG 4');
  const [selectedTanggal, setSelectedTanggal] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [monitoringData, setMonitoringData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .guruMonitoring(selectedKelas, selectedTanggal)
      .then((res) => {
        if (!cancelled && res.success) {
          setMonitoringData(res.data);
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
  }, [selectedKelas, selectedTanggal]);

  const students = monitoringData?.siswa || [];
  const filteredStudents = students.filter(
    (s) =>
      s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery)
  );

  const ringkasan = monitoringData?.ringkasan || {
    total_siswa: 0,
    hadir_hari_ini: 0,
    tepat_waktu: 0,
    terlambat: 0,
    belum_hadir: 0,
    rata_rata_bintang: 5.0,
  };

  return (
    <div className="p-5 sm:p-10 pb-28 lg:pb-10 space-y-8">
      {/* Filter Bar (#F0F0FF Rounded 24px) */}
      <div className="bg-[#f0f0ff] rounded-[24px] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedKelas}
            onChange={(e) => {
              setLoading(true);
              setSelectedKelas(e.target.value);
            }}
            className="px-4 py-2.5 bg-white border border-[#e3e1ec] rounded-full text-xs font-semibold text-[#1b1b23] focus:outline-none focus:ring-2 focus:ring-[#0055ff]"
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                Kelas {c}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedTanggal}
            onChange={(e) => {
              setLoading(true);
              setSelectedTanggal(e.target.value);
            }}
            className="px-4 py-2.5 bg-white border border-[#e3e1ec] rounded-full text-xs font-semibold text-[#1b1b23] focus:outline-none focus:ring-2 focus:ring-[#0055ff]"
          />

          <span className="px-3.5 py-2 rounded-full bg-white text-[11px] font-semibold text-[#122B51] border border-[#e3e1ec]">
            SMK Telkom Purwokerto • Wali Kelas: Firda Ayu Nirmala, S.Kom
          </span>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0055ff] hover:bg-[#0044dd] text-white text-xs font-semibold rounded-full transition-all shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Rapor PKL</span>
        </button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 print:hidden">
        <div className="bg-white p-5 rounded-[24px] border border-[#e3e1ec]/50 shadow-xs">
          <div className="text-[11px] font-semibold text-[#5d6367]">Total Siswa</div>
          <div className="text-2xl font-bold text-[#1b1b23] mt-1">{ringkasan.total_siswa}</div>
        </div>
        <div className="bg-white p-5 rounded-[24px] border border-[#e3e1ec]/50 shadow-xs">
          <div className="text-[11px] font-semibold text-[#5d6367]">Hadir Hari Ini</div>
          <div className="text-2xl font-bold text-[#0055ff] mt-1">{ringkasan.hadir_hari_ini}</div>
        </div>
        <div className="bg-white p-5 rounded-[24px] border border-[#ddf8eb] shadow-xs">
          <div className="text-[11px] font-semibold text-[#135e3d]">Tepat Waktu</div>
          <div className="text-2xl font-bold text-[#135e3d] mt-1">{ringkasan.tepat_waktu}</div>
        </div>
        <div className="bg-white p-5 rounded-[24px] border border-rose-100 shadow-xs">
          <div className="text-[11px] font-semibold text-[#be123c]">Terlambat</div>
          <div className="text-2xl font-bold text-[#be123c] mt-1">{ringkasan.terlambat}</div>
        </div>
        <div className="bg-white p-5 rounded-[24px] border border-[#e3e1ec]/50 shadow-xs">
          <div className="text-[11px] font-semibold text-[#5d6367]">Belum Hadir</div>
          <div className="text-2xl font-bold text-[#5d6367] mt-1">{ringkasan.belum_hadir}</div>
        </div>
        <div className="bg-[#0055ff] p-5 rounded-[24px] text-white shadow-sm">
          <div className="text-[11px] font-semibold text-white/80">Rata Bintang</div>
          <div className="text-2xl font-bold mt-1">★ {ringkasan.rata_rata_bintang}</div>
        </div>
      </div>

      {/* Main Student Table */}
      <div className="bg-white rounded-[24px] border border-[#e3e1ec]/50 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="p-6 border-b border-[#e3e1ec]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#5d6367] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan NIS atau Nama Siswa..."
              className="w-full pl-11 pr-4 py-2.5 bg-[#f8f8fd] border border-[#e3e1ec] rounded-full text-xs text-[#1b1b23] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0055ff]"
            />
          </div>
          <div className="text-xs text-[#5d6367] font-medium">
            Menampilkan <strong>{filteredStudents.length}</strong> dari{' '}
            <strong>{students.length}</strong> siswa
          </div>
        </div>

        <div className="hidden print:block p-8 text-center border-b-2 border-black mb-6">
          <h2 className="text-xl font-bold uppercase">SMK TELKOM PURWOKERTO • RAPOR KEDISIPLINAN PKL</h2>
          <p className="text-xs text-gray-600 mt-1">
            KELAS {selectedKelas} (RPL) • WALI KELAS: FIRDA AYU NIRMALA, S.KOM • TANGGAL {selectedTanggal}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#f8f8fd] text-[11px] font-semibold text-[#5d6367] uppercase tracking-wider border-b border-[#e3e1ec]">
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4">NIS</th>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Kehadiran Hari Ini</th>
                <th className="py-3.5 px-4 text-center">Jam Datang</th>
                <th className="py-3.5 px-4 text-center">Poin</th>
                <th className="py-3.5 px-4 text-center">Bintang PKL</th>
                <th className="py-3.5 px-4 text-center">Predikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e1ec]/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#5d6367] text-xs">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#5d6367] text-xs">
                    Tidak ada siswa ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, index) => (
                  <tr key={s.user_id} className="hover:bg-[#f8f8fd]/70 transition-all">
                    <td className="py-3.5 px-4 text-center text-xs text-[#5d6367] font-mono">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-[#5d6367] font-semibold">
                      {s.nis}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1b1b23] text-xs">
                      {s.nama_lengkap}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
                          s.status_hari_ini === 'Tepat Waktu'
                            ? 'bg-[#ddf8eb] text-[#135e3d]'
                            : s.status_hari_ini === 'Terlambat'
                            ? 'bg-[#ffe4e6] text-[#be123c]'
                            : 'bg-[#f8f8fd] text-[#5d6367]'
                        }`}
                      >
                        {s.status_hari_ini === 'Tepat Waktu' && <CheckCircle2 className="w-3 h-3" />}
                        {s.status_hari_ini === 'Terlambat' && <AlertTriangle className="w-3 h-3" />}
                        {s.status_hari_ini === 'Belum Hadir' && <Clock className="w-3 h-3" />}
                        {s.status_hari_ini}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-mono text-[#5d6367]">
                      {s.jam_datang || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#f0f0ff] text-[#0055ff]">
                        {s.poin_kedisiplinan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-amber-500 text-xs">
                      ★ {Number(s.bintang).toFixed(1)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-[#1b1b23]">
                      {s.predikat}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
