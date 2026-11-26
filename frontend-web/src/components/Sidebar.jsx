import React from 'react';
import {
  Home,
  Calendar,
  QrCode,
  ClipboardCheck,
  Award,
  User,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import HadirLogo from './HadirLogo';
import { resolveAvatarUrl } from '../services/api';

export default function Sidebar({ user, activeTab, setActiveTab, onOpenDownload }) {
  const avatarUrl = resolveAvatarUrl(user);
  const isGuruOrAdmin = user?.role === 'guru' || user?.role === 'admin';
  const isOrangTua = user?.role === 'orang_tua';

  const navItems = isGuruOrAdmin
    ? [
        { id: 'monitoring', label: 'Monitoring Guru', icon: ShieldCheck },
        { id: 'jadwal', label: 'Jadwal Pelajaran', icon: Calendar },
        { id: 'profil', label: 'Profil', icon: User },
      ]
    : isOrangTua
    ? [
        { id: 'dashboard', label: 'Pantau Anak', icon: Home },
        { id: 'aktivitas', label: 'Aktivitas Anak', icon: ClipboardCheck },
        { id: 'jadwal', label: 'Jadwal Anak', icon: Calendar },
        { id: 'rapot', label: 'Rapot PKL Anak', icon: Award },
        { id: 'profil', label: 'Profil', icon: User },
      ]
    : [
        { id: 'dashboard', label: 'Beranda', icon: Home },
        { id: 'jadwal', label: 'Jadwal Pelajaran', icon: Calendar },
        { id: 'presensi', label: 'Presensi QR', icon: QrCode },
        { id: 'aktivitas', label: 'Aktivitas Siswa', icon: ClipboardCheck },
        { id: 'rapot', label: 'Rapot Kehadiran', icon: Award },
        { id: 'profil', label: 'Profil', icon: User },
      ];

  const initials = (user?.nama_lengkap || 'S')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Persistent Desktop Sidebar */}
      <aside className="hidden lg:flex w-[256px] shrink-0 bg-white border-r border-[#e3e1ec]/60 flex-col justify-between min-h-screen px-6 py-6 sticky top-0 h-screen print:hidden">
        <div className="space-y-8">
          <div
            onClick={() => setActiveTab(isGuruOrAdmin ? 'monitoring' : 'dashboard')}
            className="flex items-center px-2 cursor-pointer"
          >
            <HadirLogo />
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-[14px] font-semibold tracking-[0.1px] transition-all w-full text-left ${
                    isActive
                      ? 'bg-[#0055ff] text-white shadow-sm'
                      : 'text-[#5d6367] hover:bg-[#f0f0ff] hover:text-[#0055ff]'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onOpenDownload}
            className="w-full py-2.5 px-4 rounded-full bg-[#f8f8fd] hover:bg-[#f0f0ff] border border-[#e3e1ec] text-[#122B51] hover:text-[#0055ff] text-[12px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#0055ff]" />
            <span>Download Android &amp; iOS</span>
          </button>

          {/* Bottom User Pill */}
          <button
          type="button"
          onClick={() => setActiveTab('profil')}
          className="bg-[#f0f0ff] hover:bg-[#e7e8ff] transition-all rounded-[24px] p-3 flex items-center gap-3 w-full text-left"
        >
          <div className="w-10 h-10 rounded-full bg-[#0055ff] text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.nama_lengkap || 'Profil'}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-[#1b1b23] truncate">
              {user?.nama_lengkap}
            </div>
            <div className="text-[11px] font-medium text-[#5d6367] truncate">
              {isOrangTua
                ? `Anak: ${user?.child_name || '-'} (${user?.kelas || 'XI PPLG 4'})`
                : user?.kelas || user?.role}
            </div>
          </div>
        </button>
        </div>
      </aside>

      {/* Mobile Floating Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-40 print:hidden">
        <div className="bg-white/95 backdrop-blur-md border border-[#e3e1ec]/70 rounded-full shadow-[0_8px_30px_rgba(15,23,42,0.12)] px-3 py-2 flex items-center justify-around relative">
          {isGuruOrAdmin ? (
            <>
              <button
                onClick={() => setActiveTab('monitoring')}
                className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold px-3 py-1 ${
                  activeTab === 'monitoring' ? 'text-[#0055ff]' : 'text-[#5d6367]'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Monitoring</span>
              </button>
              <button
                onClick={() => setActiveTab('jadwal')}
                className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold px-3 py-1 ${
                  activeTab === 'jadwal' ? 'text-[#0055ff]' : 'text-[#5d6367]'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Jadwal</span>
              </button>
              <button
                onClick={() => setActiveTab('profil')}
                className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold px-3 py-1 ${
                  activeTab === 'profil' ? 'text-[#0055ff]' : 'text-[#5d6367]'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profil</span>
              </button>
            </>
          ) : isOrangTua ? (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold px-2 py-1 ${
                  activeTab === 'dashboard' ? 'text-[#0055ff]' : 'text-[#5d6367]'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Pantau</span>
              </button>
              <button
                onClick={() => setActiveTab('aktivitas')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold px-2 py-1 ${
                  activeTab === 'aktivitas' ? 'text-[#0055ff]' : 'text-[#5d6367]'
                }`}
              >
                <ClipboardCheck className="w-5 h-5" />
                <span>Aktivitas</span>
              </button>
              <button
                onClick={() => setActiveTab('jadwal')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold px-2 py-1 ${
                  activeTab === 'jadwal' ? 'text-[#0055ff]' : 'text-[#5d6367]'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Jadwal</span>
              </button>
              <button
                onClick={() => setActiveTab('rapot')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold px-2 py-1 ${
                  activeTab === 'rapot' ? 'text-[#0055ff]' : 'text-[#5d6367]'
                }`}
              >
                <Award className="w-5 h-5" />
                <span>Rapot</span>
              </button>
              <button
                onClick={() => setActiveTab('profil')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold px-2 py-1 ${
                  activeTab === 'profil' ? 'text-[#0055ff]' : 'text-[#5d6367]'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profil</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold px-2 py-1 ${
                  activeTab === 'dashboard' ? 'text-[#0055ff]' : 'text-[#5d6367]'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Beranda</span>
              </button>
              <button
                onClick={() => setActiveTab('jadwal')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold px-2 py-1 ${
                  activeTab === 'jadwal' ? 'text-[#0055ff]' : 'text-[#5d6367]'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Jadwal</span>
              </button>

              <button
                onClick={() => setActiveTab('presensi')}
                className="flex flex-col items-center -mt-7"
              >
                <div className="w-14 h-14 rounded-full bg-[#0055ff] text-white shadow-lg shadow-[#0055ff]/35 flex items-center justify-center ring-4 ring-white">
                  <QrCode className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-[#0055ff] mt-1">
                  Scan QR
                </span>
              </button>

              <button
                onClick={() => setActiveTab('aktivitas')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold px-2 py-1 ${
                  activeTab === 'aktivitas' ? 'text-[#0055ff]' : 'text-[#5d6367]'
                }`}
              >
                <ClipboardCheck className="w-5 h-5" />
                <span>Aktivitas</span>
              </button>
              <button
                onClick={() => setActiveTab('profil')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold px-2 py-1 ${
                  activeTab === 'profil' ? 'text-[#0055ff]' : 'text-[#5d6367]'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profil</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
