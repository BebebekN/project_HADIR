import React, { useState } from 'react';
import {
  ArrowLeft,
  IdCard,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  Users,
  Info,
  Download,
  Smartphone,
} from 'lucide-react';
import { authApi } from '../services/api';
import HadirLogo from '../components/HadirLogo';
import DownloadAppModal from '../components/DownloadAppModal';

export default function LoginPage({ onLoginSuccess }) {
  const [nisNip, setNisNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotNote, setShowForgotNote] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nisNip || !password) {
      setErrorMessage('ID pengguna dan Kata Sandi wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const res = await authApi.login(nisNip, password);

      if (res.success && res.data?.token) {
        localStorage.setItem('psas_token', res.data.token);
        localStorage.setItem('psas_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      } else {
        setErrorMessage(res.message || 'Login gagal.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Gagal terhubung ke server. Pastikan backend Laravel sedang berjalan.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const setDemo = (userNis, pass) => {
    setNisNip(userNis);
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#f0f0ff] lg:grid lg:grid-cols-12 flex flex-col">
      {/* Left Visual Column */}
      <div className="lg:col-span-5 bg-[#f0f0ff] px-6 py-6 lg:p-12 flex flex-col justify-between">
        <div className="flex items-center justify-between w-full">
          <a
            href="http://127.0.0.1:8000/admin"
            target="_blank"
            rel="noreferrer"
            title="Panel Admin Filament"
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#122B51] shadow-xs transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>

          <HadirLogo />
        </div>

        <div className="my-6 lg:my-0 flex flex-col items-center justify-center gap-4">
          <div className="w-full max-w-[440px] h-[220px] sm:h-[310px] bg-white rounded-[24px] shadow-[0_4px_14px_rgba(18,43,81,0.08)] overflow-hidden flex items-center justify-center">
            <img
              src="/ilustrasi-portal.png"
              alt="Ilustrasi Portal HADIR"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-[13px] sm:text-[14px] text-[#5d6367] text-center max-w-[384px] leading-[20px]">
            SMK Telkom Purwokerto • Portal Presensi QR, Jadwal XI PPLG 4 &amp; Pantauan Orang Tua (2026/2027).
          </p>
        </div>

        <p className="hidden lg:block text-[12px] text-[#5d6367]">
          Butuh bantuan akun? Hubungi Wali Kelas (<strong>Firda Ayu Nirmala, S.Kom</strong>) atau{' '}
          <a
            href="http://127.0.0.1:8000/admin"
            target="_blank"
            rel="noreferrer"
            className="text-[#0055ff] font-semibold hover:underline"
          >
            Panel Admin (/admin)
          </a>
          .
        </p>
      </div>

      {/* Right Form Column */}
      <div className="lg:col-span-7 bg-white rounded-t-[28px] lg:rounded-none flex-1 flex items-center justify-center p-6 sm:p-14">
        <div className="w-full max-w-[468px] bg-white rounded-[24px] border border-[#e3e1ec]/50 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08)] p-7 sm:p-9 space-y-5">
          <div className="space-y-1">
            <h1 className="text-[24px] font-bold text-[#1b1b23] tracking-[-0.2px] leading-[32px]">
              Selamat Datang
            </h1>
            <p className="text-[14px] text-[#5d6367] leading-[20px]">
              Masuk sebagai Siswa, Guru, atau Orang Tua (Double NIS anak)
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {showForgotNote && (
            <div className="p-3.5 rounded-2xl bg-[#f0f0ff] border border-[#0055ff]/20 flex items-start gap-2.5 text-[#122B51] text-xs">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#0055ff]" />
              <span>
                Orang Tua masuk dengan <strong>Double NIS anak</strong> (NIS ditulis 2x berturut-turut, misal{' '}
                <code className="font-mono font-bold">541251041541251041</code>) pada kolom ID &amp; Kata Sandi.
                Kendala akun hubungi Wali Kelas (<strong>Firda Ayu Nirmala, S.Kom</strong>).
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-semibold text-[#1b1b23] tracking-[0.2px]">
                NIS / NIP / ID Orang Tua (Double NIS)
              </label>
              <div className="relative">
                <IdCard className="w-5 h-5 text-[#5d6367] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={nisNip}
                  onChange={(e) => setNisNip(e.target.value)}
                  placeholder="Contoh: 541251041 atau 541251041541251041"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-[#f8f8fd] border border-[#e3e1ec] rounded-full text-[14px] text-[#1b1b23] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0055ff] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-semibold text-[#1b1b23] tracking-[0.2px]">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#5d6367] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-[#f8f8fd] border border-[#e3e1ec] rounded-full text-[14px] text-[#1b1b23] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0055ff] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-[#e3e1ec]/50 flex items-center justify-center text-[#5d6367]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotNote((v) => !v)}
                  className="text-[12px] font-semibold text-[#0055ff] hover:underline"
                >
                  Cara Login Orang Tua / Lupa Password?
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-full bg-[#0055ff] hover:bg-[#0044dd] text-white font-semibold text-[14px] tracking-[0.1px] shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Masuk</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Role Fill Buttons (Siswa, Guru, Orang Tua) */}
          <div className="pt-4 border-t border-[#e3e1ec]/60 space-y-2.5">
            <p className="text-center text-[11px] font-medium text-[#5d6367]">
              Akses Cepat 3 Peran Pengguna (XI PPLG 4):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemo('541251041', 'siswa123')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-[#f0f0ff] hover:bg-[#e2e4ff] text-[#0055ff] font-semibold text-[11px] transition-all"
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Siswa</span>
              </button>

              <button
                type="button"
                onClick={() => setDemo('198804122015032003', 'guru123')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-[#f8f8fd] hover:bg-[#ececf8] border border-[#e3e1ec] text-[#122B51] font-semibold text-[11px] transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#00C2B3] shrink-0" />
                <span className="truncate">Guru (Firda)</span>
              </button>

              <button
                type="button"
                onClick={() => setDemo('541251041541251041', '541251041541251041')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-[#ddf8eb] hover:bg-[#c8f2de] text-[#135e3d] font-semibold text-[11px] transition-all"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Orang Tua</span>
              </button>
            </div>
            <p className="text-center text-[10px] text-[#5d6367]">
              Orang Tua login memakai Double NIS anak (contoh: <span className="font-mono font-semibold">541251041541251041</span>) sebagai ID &amp; Kata Sandi.
            </p>
          </div>

          {/* Direct Mobile App Download Card (Android APK & iOS Web App) */}
          <div className="pt-3 border-t border-[#e3e1ec]/60">
            <button
              type="button"
              onClick={() => setDownloadOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-[#f0f0ff] hover:bg-[#e5e7ff] border border-[#0055ff]/15 flex items-center justify-between gap-3 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#0055ff] text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-[#122B51] truncate">
                    Belum punya aplikasi di HP?
                  </div>
                  <div className="text-[11px] text-[#5d6367] truncate">
                    Download HADIR untuk Android (APK) &amp; iOS (iPhone)
                  </div>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-white text-[#0055ff] text-[11px] font-bold shadow-xs flex items-center gap-1 shrink-0">
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <DownloadAppModal open={downloadOpen} onClose={() => setDownloadOpen(false)} />
    </div>
  );
}
