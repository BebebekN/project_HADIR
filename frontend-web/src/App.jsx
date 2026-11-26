import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import DownloadAppModal from './components/DownloadAppModal';
import LoginPage from './pages/LoginPage';
import DashboardSiswa from './pages/DashboardSiswa';
import JadwalPage from './pages/JadwalPage';
import PresensiQrPage from './pages/PresensiQrPage';
import AktivitasPage from './pages/AktivitasPage';
import RapotPklPage from './pages/RapotPklPage';
import MonitoringGuruPage from './pages/MonitoringGuruPage';
import ProfilPage from './pages/ProfilPage';
import { authApi, dashboardApi } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('psas_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('psas_user');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed?.role === 'guru' || parsed?.role === 'admin'
        ? 'monitoring'
        : 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [attendanceNotif, setAttendanceNotif] = useState(null);
  const [downloadOpen, setDownloadOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('psas_token');
    if (token) {
      authApi
        .me()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('psas_user', JSON.stringify(res.data));
            if (res.data.role === 'siswa' || res.data.role === 'orang_tua') {
              dashboardApi
                .siswa()
                .then((dash) => {
                  if (dash.success && dash.data?.notifikasi_presensi) {
                    setAttendanceNotif(dash.data.notifikasi_presensi);
                  }
                })
                .catch(() => {});
            } else {
              setAttendanceNotif(null);
            }
          }
        })
        .catch(() => {
          // Handled by 401 interceptor
        });
    } else {
      setAttendanceNotif(null);
    }

    const handleForceLogout = () => {
      setUser(null);
      setAttendanceNotif(null);
      setActiveTab('dashboard');
    };

    window.addEventListener('auth-logout', handleForceLogout);
    return () => window.removeEventListener('auth-logout', handleForceLogout);
  }, [refreshKey]);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setRefreshKey((prev) => prev + 1);
    if (loggedInUser.role === 'guru' || loggedInUser.role === 'admin') {
      setActiveTab('monitoring');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('psas_token');
      localStorage.removeItem('psas_user');
      setUser(null);
      setActiveTab('dashboard');
    }
  };

  const handleScanSuccess = (scanData) => {
    if (scanData && user) {
      const updatedUser = {
        ...user,
        poin_kedisiplinan: scanData.sisa_poin ?? user.poin_kedisiplinan,
        bintang: scanData.bintang ?? user.bintang,
      };
      setUser(updatedUser);
      localStorage.setItem('psas_user', JSON.stringify(updatedUser));
    }
    setRefreshKey((prev) => prev + 1);
  };

  const handleUserUpdated = (updatedUser) => {
    if (!updatedUser) return;
    setUser(updatedUser);
    localStorage.setItem('psas_user', JSON.stringify(updatedUser));
    setRefreshKey((prev) => prev + 1);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isGuruOrAdmin = user.role === 'guru' || user.role === 'admin';
  const isOrangTua = user.role === 'orang_tua';

  const renderPage = () => {
    switch (activeTab) {
      case 'jadwal':
        return <JadwalPage user={user} />;
      case 'presensi':
        return isOrangTua ? (
          <AktivitasPage user={user} />
        ) : (
          <PresensiQrPage
            onScanSuccess={handleScanSuccess}
            onOpenRapot={() => setActiveTab('rapot')}
          />
        );
      case 'aktivitas':
        return <AktivitasPage user={user} />;
      case 'rapot':
        return <RapotPklPage user={user} refreshKey={refreshKey} />;
      case 'monitoring':
        return isGuruOrAdmin ? (
          <MonitoringGuruPage />
        ) : (
          <DashboardSiswa user={user} onNavigate={setActiveTab} refreshKey={refreshKey} />
        );
      case 'profil':
        return (
          <ProfilPage
            user={user}
            onLogout={handleLogout}
            onUserUpdated={handleUserUpdated}
            onOpenDownload={() => setDownloadOpen(true)}
          />
        );
      case 'dashboard':
      default:
        return isGuruOrAdmin ? (
          <MonitoringGuruPage />
        ) : (
          <DashboardSiswa
            user={user}
            onNavigate={setActiveTab}
            refreshKey={refreshKey}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8fd] flex">
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDownload={() => setDownloadOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          user={user}
          activeTab={activeTab}
          onOpenRapot={() => setActiveTab(isGuruOrAdmin ? 'monitoring' : 'rapot')}
          onNavigate={setActiveTab}
          notification={attendanceNotif}
        />
        <main className="flex-1">{renderPage()}</main>
      </div>

      <DownloadAppModal open={downloadOpen} onClose={() => setDownloadOpen(false)} />
    </div>
  );
}
