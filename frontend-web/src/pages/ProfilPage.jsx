import React, { useRef, useState } from 'react';
import {
  User,
  Lock,
  Bell,
  HelpCircle,
  Info,
  ChevronRight,
  LogOut,
  ExternalLink,
  Camera,
  Trash2,
  Loader2,
  Smartphone,
} from 'lucide-react';
import HadirLogo from '../components/HadirLogo';
import { authApi, resolveAvatarUrl } from '../services/api';

export default function ProfilPage({ user, onLogout, onUserUpdated, onOpenDownload }) {
  const [activeInfo, setActiveInfo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef(null);

  const initials = (user?.nama_lengkap || 'S')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const avatarUrl = resolveAvatarUrl(user);

  const toggleInfo = (key) => {
    setActiveInfo((prev) => (prev === key ? '' : key));
  };

  const openFilePicker = () => {
    if (uploading) return;
    setFeedback({ type: '', text: '' });
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'Ukuran foto maksimal 5 MB.' });
      return;
    }

    try {
      setUploading(true);
      setFeedback({ type: '', text: '' });
      const res = await authApi.updatePhoto(file);
      if (res.success && res.data) {
        setImgError(false);
        onUserUpdated?.(res.data);
        setFeedback({ type: 'success', text: res.message || 'Foto profil diperbarui.' });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Gagal mengunggah foto profil. Pastikan format JPG, PNG, atau WEBP.';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (uploading || !avatarUrl) return;
    try {
      setUploading(true);
      setFeedback({ type: '', text: '' });
      const res = await authApi.deletePhoto();
      if (res.success && res.data) {
        setImgError(false);
        onUserUpdated?.(res.data);
        setFeedback({ type: 'success', text: 'Foto profil dikembalikan ke inisial.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Gagal menghapus foto profil.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-5 sm:p-10 pb-28 lg:pb-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handlePhotoChange}
      />

      {/* Left 4 Cols: Blue Profile Card + Red Keluar Button */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-[#0055ff] rounded-[24px] p-8 text-white text-center shadow-md flex flex-col items-center space-y-3">
          <div className="relative">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading}
              title="Ketuk untuk ganti foto profil"
              className="w-24 h-24 rounded-full bg-white text-[#122B51] font-bold text-2xl flex items-center justify-center shadow-md ring-4 ring-[#00C2B3]/40 overflow-hidden cursor-pointer relative group"
            >
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={user?.nama_lengkap || 'Foto Profil'}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}

              {uploading && (
                <span className="absolute inset-0 bg-black/45 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading}
              aria-label="Edit Foto Profil"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-[#0055ff] shadow-md flex items-center justify-center hover:bg-[#f0f0ff] border border-[#e3e1ec] transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-[18px] font-bold">{user?.nama_lengkap}</h2>
            <p className="text-[12px] font-mono text-white/85 mt-1">
              NIS/NIP: {user?.nis_nip}
            </p>
            <p className="text-[12px] text-white/90 mt-0.5 capitalize">
              {user?.role === 'orang_tua'
                ? `Orang Tua dari ${user?.child_name || '-'} (${user?.kelas || 'XI PPLG 4'})`
                : user?.kelas
                ? `${user.kelas} • Rekayasa Perangkat Lunak (SMK Telkom Purwokerto)`
                : `Guru / Pembina • ${user?.role}`}
            </p>
            <p className="text-[11px] text-[#ddf8eb] font-medium mt-1">
              Wali Kelas XI PPLG 4: Firda Ayu Nirmala, S.Kom
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading}
              className="px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{uploading ? 'Mengunggah...' : 'Ganti Foto Profil'}</span>
            </button>

            {avatarUrl && !imgError && (
              <button
                type="button"
                onClick={handleDeletePhoto}
                disabled={uploading}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-[#dc2626] text-white/95 text-[12px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            )}
          </div>

          {feedback.text && (
            <div
              className={`w-full rounded-2xl px-3 py-2 text-[11px] font-medium ${
                feedback.type === 'error'
                  ? 'bg-[#ffe4e6] text-[#be123c]'
                  : 'bg-[#ddf8eb] text-[#135e3d]'
              }`}
            >
              {feedback.text}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3.5 px-6 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold text-[14px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>

        {user?.role === 'admin' &&
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
          <a
            href="http://127.0.0.1:8000/admin"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-6 rounded-full bg-white border border-[#e3e1ec] hover:bg-[#f0f0ff] text-[#0055ff] font-semibold text-[13px] transition-all flex items-center justify-center gap-2"
          >
            <span>Buka Filament Admin (/admin)</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Right 8 Cols: Pengaturan & Preferensi */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#e3e1ec]/50 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-[#1b1b23]">
              Pengaturan Akun
            </h3>
            <HadirLogo className="scale-90 origin-right" />
          </div>

          <div className="divide-y divide-[#e3e1ec]/60">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading}
              className="w-full py-3.5 flex items-center justify-between text-[14px] text-[#1b1b23] hover:text-[#0055ff] text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-[#0055ff]" />
                <span>Ubah / Ganti Foto Profil</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5d6367]" />
            </button>

            <button
              type="button"
              onClick={() => toggleInfo('profil')}
              className="w-full py-3.5 flex items-center justify-between text-[14px] text-[#1b1b23] hover:text-[#0055ff] text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#0055ff]" />
                <span>Detail Identitas ({user?.role?.toUpperCase()})</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5d6367]" />
            </button>
            {activeInfo === 'profil' && (
              <div className="py-3 px-4 bg-[#f8f8fd] rounded-2xl text-xs text-[#5d6367] space-y-1">
                <div>Nama: <strong className="text-[#1b1b23]">{user?.nama_lengkap}</strong></div>
                <div>NIS / NIP: <strong className="font-mono text-[#1b1b23]">{user?.nis_nip}</strong></div>
                <div>Kelas: <strong className="text-[#1b1b23]">{user?.kelas || 'Guru / Pembimbing'}</strong></div>
              </div>
            )}

            <button
              type="button"
              onClick={() => toggleInfo('keamanan')}
              className="w-full py-3.5 flex items-center justify-between text-[14px] text-[#1b1b23] hover:text-[#0055ff] text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#0055ff]" />
                <span>Keamanan Akun &amp; Token Sanctum</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5d6367]" />
            </button>
            {activeInfo === 'keamanan' && (
              <div className="py-3 px-4 bg-[#f8f8fd] rounded-2xl text-xs text-[#5d6367]">
                Sesi autentikasi menggunakan Bearer Token Laravel Sanctum yang terhubung aman ke REST API HADIR.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#e3e1ec]/50 shadow-xs space-y-4">
          <h3 className="text-[16px] font-semibold text-[#1b1b23]">
            Preferensi &amp; Informasi
          </h3>
          <div className="divide-y divide-[#e3e1ec]/60">
            <button
              type="button"
              onClick={() => toggleInfo('aturan')}
              className="w-full py-3.5 flex items-center justify-between text-[14px] text-[#1b1b23] hover:text-[#0055ff] text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[#0055ff]" />
                <span>Aturan Skor Kedisiplinan &amp; Bintang PKL</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5d6367]" />
            </button>
            {activeInfo === 'aturan' && (
              <div className="py-3 px-4 bg-[#f8f8fd] rounded-2xl text-xs text-[#5d6367]">
                Scan datang sebelum 07:00 WIB = Tepat Waktu (poin tetap). Lewat 07:00 WIB = Terlambat (-5 poin). Rating bintang: 95–100 (5.0★), 85–94 (4.0★), 75–84 (3.0★).
              </div>
            )}

            <button
              type="button"
              onClick={() => toggleInfo('bantuan')}
              className="w-full py-3.5 flex items-center justify-between text-[14px] text-[#1b1b23] hover:text-[#0055ff] text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-[#0055ff]" />
                <span>Bantuan Wali Kelas &amp; Tata Usaha</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5d6367]" />
            </button>
            {activeInfo === 'bantuan' && (
              <div className="py-3 px-4 bg-[#f8f8fd] rounded-2xl text-xs text-[#5d6367]">
                Wali Kelas XI PPLG 4: <strong>Firda Ayu Nirmala, S.Kom</strong> (SMK Telkom Purwokerto). Hubungi beliau atau Admin jika terjadi kendala pemindaian QR.
              </div>
            )}

            <button
              type="button"
              onClick={onOpenDownload}
              className="w-full py-3.5 flex items-center justify-between text-[14px] text-[#1b1b23] hover:text-[#0055ff] text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-[#0055ff]" />
                <span>Download Aplikasi Android &amp; iOS</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5d6367]" />
            </button>

            <div className="py-3.5 flex items-center justify-between text-[14px] text-[#1b1b23]">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-[#00C2B3]" />
                <span>HADIR — Sistem Informasi Presensi &amp; Rapor PKL v1.1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
