import React, { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import HadirLogo from './HadirLogo';

export default function DownloadAppModal({ open, onClose }) {
  const [platform, setPlatform] = useState(() => {
    if (typeof navigator !== 'undefined' && /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
      return 'ios';
    }
    return 'android';
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleInstalled = () => {
      setPwaInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (!open) return null;

  const isIosStandalone =
    typeof window !== 'undefined' &&
    (window.navigator.standalone === true ||
      window.matchMedia?.('(display-mode: standalone)').matches);

  const handleTriggerPwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setPwaInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[540px] bg-white rounded-[28px] shadow-2xl border border-[#e3e1ec] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="bg-[#0055ff] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold leading-tight">
                Download Aplikasi HADIR
              </h2>
              <p className="text-[12px] text-white/85">
                SMK Telkom Purwokerto • Android APK &amp; iOS Web App
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal download"
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Platform Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#f0f0ff] rounded-full">
            <button
              type="button"
              onClick={() => setPlatform('android')}
              className={`py-2.5 px-4 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
                platform === 'android'
                  ? 'bg-[#0055ff] text-white shadow-xs'
                  : 'text-[#5d6367] hover:text-[#1b1b23]'
              }`}
            >
              Android (.APK)
            </button>
            <button
              type="button"
              onClick={() => setPlatform('ios')}
              className={`py-2.5 px-4 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
                platform === 'ios'
                  ? 'bg-[#0055ff] text-white shadow-xs'
                  : 'text-[#5d6367] hover:text-[#1b1b23]'
              }`}
            >
              iOS (iPhone / iPad)
            </button>
          </div>

          {platform === 'android' ? (
            <div className="space-y-4">
              <div className="bg-[#f8f8fd] border border-[#e3e1ec] rounded-[20px] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <HadirLogo variant="squircle" showWordmark={false} />
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-[#1b1b23] truncate">
                      HADIR Mobile Android
                    </div>
                    <div className="text-[12px] text-[#5d6367]">
                      Versi 1.1 • APK Langsung • ~27.3 MB • Android 7.0+
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#ddf8eb] text-[#135e3d] text-[10px] font-bold shrink-0">
                  Resmi
                </span>
              </div>

              <a
                href="/downloads/HADIR-Android.apk"
                download="HADIR-Android.apk"
                className="w-full py-3.5 px-6 rounded-full bg-[#0055ff] hover:bg-[#0044dd] text-white font-bold text-[14px] shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download APK Android Sekarang</span>
              </a>

              <div className="bg-[#f0f0ff] rounded-[20px] p-4 space-y-2 text-[12px] text-[#122B51]">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0055ff]" />
                  <span>Langkah Pemasangan di HP Android:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[#5d6367]">
                  <li>Tekan tombol <strong>Download APK Android Sekarang</strong> di atas.</li>
                  <li>Buka file <code className="font-mono text-[#122B51]">HADIR-Android.apk</code> yang selesai diunduh.</li>
                  <li>Jika muncul izin keamanan browser/file manager, pilih <strong>Izinkan dari sumber ini</strong> lalu tekan <strong>Instal</strong>.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#f8f8fd] border border-[#e3e1ec] rounded-[20px] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <HadirLogo variant="squircle" showWordmark={false} />
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-[#1b1b23] truncate">
                      HADIR Web App (iOS &amp; iPadOS)
                    </div>
                    <div className="text-[12px] text-[#5d6367]">
                      Pasang langsung ke Layar Utama via Safari (tanpa App Store)
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#e8eeff] text-[#0055ff] text-[10px] font-bold shrink-0">
                  PWA
                </span>
              </div>

              {isIosStandalone || pwaInstalled ? (
                <div className="p-4 rounded-[20px] bg-[#ddf8eb] text-[#135e3d] text-[13px] font-semibold flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Aplikasi HADIR sudah terpasang dalam mode Layar Penuh di perangkat ini!</span>
                </div>
              ) : deferredPrompt ? (
                <button
                  type="button"
                  onClick={handleTriggerPwaInstall}
                  className="w-full py-3.5 px-6 rounded-full bg-[#122B51] hover:bg-[#0f2240] text-white font-bold text-[14px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Pasang Aplikasi HADIR ke Layar Utama</span>
                </button>
              ) : null}

              <div className="bg-[#f0f0ff] rounded-[20px] p-4 space-y-2.5 text-[12px] text-[#122B51]">
                <div className="font-bold">
                  Cara Pasang Aplikasi HADIR di iPhone / iPad:
                </div>
                <ol className="space-y-2 text-[#5d6367]">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0055ff] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>
                      Buka website <strong>HADIR</strong> ini menggunakan browser <strong>Safari</strong> di iPhone/iPad.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0055ff] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span className="flex items-center flex-wrap gap-1">
                      Ketuk tombol <strong>Bagikan (Share)</strong>{' '}
                      <Share className="w-3.5 h-3.5 text-[#0055ff] inline" /> di bilah bawah/atas Safari.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0055ff] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span className="flex items-center flex-wrap gap-1">
                      Pilih <strong>Tambah ke Layar Utama / Add to Home Screen</strong>{' '}
                      <PlusSquare className="w-3.5 h-3.5 text-[#0055ff] inline" />, lalu tekan <strong>Tambah</strong>.
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
