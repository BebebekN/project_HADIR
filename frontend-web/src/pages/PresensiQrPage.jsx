import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogIn,
  LogOut as LogOutIcon,
  Send,
  Loader2,
  KeyRound,
  MapPin,
  RefreshCw,
  Lock,
  Unlock,
} from 'lucide-react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { presensiApi } from '../services/api';

const DEFAULT_GEOFENCE = {
  name: 'SMK Telkom Purwokerto',
  latitude: -7.43521,
  longitude: 109.24921,
  radius_meters: 150,
};

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function PresensiQrPage({ onScanSuccess, onOpenRapot }) {
  const [scanMode, setScanMode] = useState('Kehadiran');
  const [qrToken, setQrToken] = useState('');
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  // GPS Geofencing state
  const [coords, setCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('loading'); // loading | ready | error
  const [gpsError, setGpsError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorIntervalRef = useRef(null);
  const handledScanRef = useRef(false);

  const geofence = todayData?.school_geofence || DEFAULT_GEOFENCE;
  const distanceMeters = coords
    ? Math.round(
        haversineDistanceMeters(
          coords.latitude,
          coords.longitude,
          Number(geofence.latitude),
          Number(geofence.longitude)
        )
      )
    : null;
  const isInsideSchool =
    distanceMeters !== null && distanceMeters <= Number(geofence.radius_meters);

  const requestGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsError('Browser tidak mendukung geolokasi GPS.');
      return Promise.reject(new Error('Browser tidak mendukung geolokasi GPS.'));
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nextCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setCoords(nextCoords);
          setGpsStatus('ready');
          setGpsError('');
          resolve(nextCoords);
        },
        (err) => {
          const msg =
            err.code === 1
              ? 'Izin lokasi ditolak. Aktifkan izin lokasi browser untuk absen di SMK Telkom Purwokerto.'
              : 'Gagal memperoleh koordinat GPS. Pastikan lokasi perangkat menyala.';
          setGpsStatus('error');
          setGpsError(msg);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (detectorIntervalRef.current) {
      clearInterval(detectorIntervalRef.current);
      detectorIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const refreshToday = useCallback(async () => {
    try {
      const res = await presensiApi.today();
      if (res.success) setTodayData(res.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    presensiApi
      .today()
      .then((res) => {
        if (!cancelled && res.success) {
          setTodayData(res.data);
        }
      })
      .catch(() => {
        // ignore
      });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setGpsStatus('ready');
          setGpsError('');
        },
        () => {
          if (cancelled) return;
          setGpsStatus('error');
          setGpsError('Aktifkan izin lokasi browser untuk validasi kawasan SMK Telkom Purwokerto.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera]);

  const submitScan = useCallback(
    async (tokenValue) => {
      const cleanToken = (tokenValue || qrToken).trim();
      if (!cleanToken) {
        setErrorMsg('Silakan pindai QR Code atau masukkan kode resmi buatan Admin.');
        return;
      }

      try {
        setLoading(true);
        setErrorMsg('');
        setFeedback(null);

        // Always get fresh coordinates if missing
        const activeCoords = coords || (await requestGpsLocation());
        const dist = Math.round(
          haversineDistanceMeters(
            activeCoords.latitude,
            activeCoords.longitude,
            Number(geofence.latitude),
            Number(geofence.longitude)
          )
        );

        if (dist > Number(geofence.radius_meters)) {
          setErrorMsg(
            `Presensi ditolak! Anda berada di luar kawasan ${geofence.name} (jarak ~${dist} m, batas maksimal ${geofence.radius_meters} m).`
          );
          return;
        }

        const res = await presensiApi.scan(
          cleanToken,
          activeCoords.latitude,
          activeCoords.longitude
        );
        if (res.success) {
          stopCamera();
          setFeedback(res);
          if (res.data?.status === 'Tepat Waktu') {
            confetti({
              particleCount: 90,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#0055ff', '#00C2B3', '#10b981'],
            });
          }
          refreshToday();
          if (onScanSuccess) onScanSuccess(res.data);
        } else {
          setErrorMsg(res.message || 'Gagal mencatat presensi.');
        }
      } catch (err) {
        setErrorMsg(
          err.response?.data?.message ||
            err.message ||
            'Kode QR tidak valid atau lokasi Anda di luar kawasan sekolah.'
        );
      } finally {
        setLoading(false);
      }
    },
    [coords, geofence.latitude, geofence.longitude, geofence.name, geofence.radius_meters, onScanSuccess, qrToken, refreshToday, requestGpsLocation, stopCamera]
  );

  // Bind camera stream & run cross-browser QR decoder (jsQR for iOS/Safari/Firefox + BarcodeDetector boost)
  useEffect(() => {
    if (!cameraActive || !streamRef.current) return undefined;

    const video = videoRef.current;
    if (!video) return undefined;

    let cancelled = false;
    handledScanRef.current = false;

    video.srcObject = streamRef.current;
    video.setAttribute('playsinline', 'true');
    video.muted = true;
    video.play().catch(() => {});

    const onLoadedMeta = () => {
      video.play().catch(() => {});
    };
    video.addEventListener('loadedmetadata', onLoadedMeta);

    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let lastScanTs = 0;
    const handleDetected = (rawVal) => {
      const val = String(rawVal || '').trim();
      if (!val || handledScanRef.current || cancelled) return;
      handledScanRef.current = true;
      setQrToken(val);
      stopCamera();
      submitScan(val);
    };

    const scanFrame = (ts) => {
      if (cancelled || handledScanRef.current) return;
      if (ts - lastScanTs >= 130 && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0 && ctx) {
        lastScanTs = ts;
        try {
          const maxDim = 640;
          const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
          const w = Math.max(160, Math.round(video.videoWidth * scale));
          const h = Math.max(160, Math.round(video.videoHeight * scale));
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
          ctx.drawImage(video, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          const decoded = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });
          if (decoded?.data) {
            handleDetected(decoded.data);
            return;
          }
        } catch {
          // Wait for next video frame
        }
      }
      rafRef.current = requestAnimationFrame(scanFrame);
    };
    rafRef.current = requestAnimationFrame(scanFrame);

    if ('BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        detectorIntervalRef.current = setInterval(async () => {
          if (cancelled || handledScanRef.current || !video || video.readyState < 2) return;
          try {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              handleDetected(barcodes[0].rawValue);
            }
          } catch {
            // Fallback jsQR loop handles decoding
          }
        }, 350);
      } catch {
        // Ignore unsupported format init
      }
    }

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', onLoadedMeta);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (detectorIntervalRef.current) {
        clearInterval(detectorIntervalRef.current);
        detectorIntervalRef.current = null;
      }
    };
  }, [cameraActive, stopCamera, submitScan]);

  const startCamera = async () => {
    setErrorMsg('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Kamera browser tidak tersedia. Pindai dari HP Android/iPhone HTTPS atau ketik kode QR dari Admin.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setErrorMsg('Izin kamera ditolak atau tidak tersedia pada browser ini.');
      setCameraActive(false);
    }
  };

  return (
    <div className="p-5 sm:p-10 pb-28 lg:pb-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left 7 Cols: Mode Tabs + Dark Scanner Card + Admin Code Input */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white border border-[#e3e1ec]/50 rounded-full p-1.5 grid grid-cols-3 gap-1 shadow-xs">
          {['Kehadiran', 'Kelas', 'Event'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setScanMode(mode)}
              className={`py-2.5 rounded-full text-[13px] font-semibold transition-all ${
                scanMode === mode
                  ? 'bg-[#0055ff] text-white shadow-xs'
                  : 'text-[#5d6367] hover:text-[#1b1b23]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Dark Scanner Frame */}
        <div className="bg-[#111827] rounded-[24px] p-6 sm:p-10 text-white shadow-lg flex flex-col items-center justify-center relative overflow-hidden min-h-[320px]">
          {cameraActive ? (
            <div className="w-full max-w-md aspect-square rounded-[20px] overflow-hidden relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-2 border-white/95 rounded-[22px] relative overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]">
                  <div className="absolute left-3 right-3 h-[2.5px] rounded-full bg-[#00C2B3] animate-qr-sweep" />
                </div>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="absolute bottom-3 right-3 px-4 py-1.5 rounded-full bg-black/70 text-white text-xs font-semibold cursor-pointer"
              >
                Matikan Kamera
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <div className="w-56 h-56 rounded-[24px] border-2 border-white/85 flex items-center justify-center relative overflow-hidden">
                <div className="absolute left-3 right-3 h-[2.5px] rounded-full bg-[#00C2B3] animate-qr-sweep" />
                <button
                  type="button"
                  onClick={startCamera}
                  className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Aktifkan Kamera
                </button>
              </div>
              <p className="text-[13px] text-white/85 font-medium text-center">
                Pindai QR Datang / QR Pulang resmi buatan Admin untuk {scanMode}
              </p>
            </div>
          )}
        </div>

        {/* Admin QR Code Manual Input (NO demo token button) */}
        <div className="bg-white rounded-[24px] p-6 border border-[#e3e1ec]/60 shadow-xs space-y-4">
          <div className="space-y-1">
            <h3 className="text-[14px] font-semibold text-[#1b1b23]">
              Input Kode QR Resmi dari Admin
            </h3>
            <p className="text-[12px] text-[#5d6367]">
              Hanya menerima QR Code / kode harian aktif yang dibuat oleh Admin di kawasan {geofence.name}.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {feedback && (
            <div className="p-4 rounded-2xl bg-[#ddf8eb] border border-[#135e3d]/20 text-[#135e3d] text-xs space-y-1">
              <div className="font-bold text-sm">{feedback.message}</div>
              <div>
                Sisa Poin: <strong>{feedback.data?.sisa_poin}</strong> • Bintang:{' '}
                <strong>{Number(feedback.data?.bintang ?? 5).toFixed(1)} ★</strong>
                {feedback.data?.jarak_meter !== undefined && (
                  <> • Jarak: <strong>{feedback.data.jarak_meter} m</strong></>
                )}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitScan();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <KeyRound className="w-4 h-4 text-[#5d6367] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="Masukkan kode QR harian dari Admin"
                className="w-full pl-11 pr-4 py-3 bg-[#f8f8fd] border border-[#e3e1ec] rounded-full text-xs font-mono text-[#1b1b23] focus:outline-none focus:ring-2 focus:ring-[#0055ff]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-full bg-[#0055ff] hover:bg-[#0044dd] text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Kirim Scan</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right 5 Cols: Geofence Status + Today's Attendance */}
      <div className="lg:col-span-5 space-y-4">
        {/* Geofence Verification Card */}
        <div
          className={`rounded-[24px] p-5 border shadow-xs space-y-3 ${
            gpsStatus === 'ready' && isInsideSchool
              ? 'bg-[#ddf8eb]/65 border-[#135e3d]/20'
              : gpsStatus === 'error' || (gpsStatus === 'ready' && !isInsideSchool)
              ? 'bg-rose-50 border-rose-200'
              : 'bg-[#f0f0ff] border-[#e3e1ec]'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  gpsStatus === 'ready' && isInsideSchool
                    ? 'bg-[#ddf8eb] text-[#135e3d]'
                    : gpsStatus === 'error' || (gpsStatus === 'ready' && !isInsideSchool)
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-white text-[#0055ff]'
                }`}
              >
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#1b1b23]">
                  Lokasi Kawasan {geofence.name}
                </div>
                <div className="text-[11px] text-[#5d6367]">
                  Radius maksimal {geofence.radius_meters} meter dari lingkungan sekolah
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => requestGpsLocation().catch(() => {})}
              title="Perbarui Lokasi GPS"
              className="p-2 rounded-full bg-white hover:bg-[#f8f8fd] border border-[#e3e1ec] text-[#0055ff] transition-all shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[12px] font-semibold">
            {gpsStatus === 'loading' && (
              <span className="text-[#0055ff]">Mendeteksi koordinat GPS perangkat...</span>
            )}
            {gpsStatus === 'ready' && isInsideSchool && (
              <span className="text-[#135e3d]">
                Terverifikasi di dalam area sekolah (~{distanceMeters} m).
              </span>
            )}
            {gpsStatus === 'ready' && !isInsideSchool && (
              <span className="text-rose-700">
                Di luar kawasan sekolah (~{distanceMeters} m). Presensi akan ditolak.
              </span>
            )}
            {gpsStatus === 'error' && (
              <span className="text-rose-700">{gpsError}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <h2 className="text-[18px] font-semibold text-[#1b1b23]">
            Status Presensi Hari Ini
          </h2>
          <button
            type="button"
            onClick={onOpenRapot}
            className="text-[12px] font-semibold text-[#0055ff] hover:underline"
          >
            Riwayat &amp; Rapot
          </button>
        </div>

        {/* Datang Card */}
        <div className="bg-white rounded-[24px] p-6 border border-[#e3e1ec]/60 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div
              className={`flex items-center gap-2 text-[15px] font-semibold ${
                todayData?.jam_datang ? 'text-[#135e3d]' : 'text-[#9a3412]'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {todayData?.jam_datang
                  ? 'Sudah Presensi Datang'
                  : '1. Siap Scan QR Code Datang'}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f8f8fd] text-[13px] font-mono font-semibold text-[#1b1b23]">
              <Clock className="w-4 h-4 text-[#135e3d]" />
              <span>{todayData?.jam_datang || '--:--'}</span>
            </div>
          </div>
          <LogIn
            className={`w-6 h-6 shrink-0 ${
              todayData?.jam_datang ? 'text-[#135e3d]' : 'text-[#9a3412]'
            }`}
          />
        </div>

        {/* Pulang Card (terkunci sampai Datang & KBM selesai) */}
        <div className="bg-white rounded-[24px] p-6 border border-[#e3e1ec]/60 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <div
                className={`flex items-center gap-2 text-[15px] font-semibold ${
                  todayData?.jam_pulang
                    ? 'text-[#135e3d]'
                    : todayData?.boleh_scan_pulang
                    ? 'text-[#0055ff]'
                    : 'text-[#b91c1c]'
                }`}
              >
                {todayData?.jam_pulang ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : todayData?.boleh_scan_pulang ? (
                  <Unlock className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                <span>
                  {todayData?.jam_pulang
                    ? 'Sudah Presensi Pulang'
                    : todayData?.boleh_scan_pulang
                    ? '2. QR Code Pulang Terbuka'
                    : '2. QR Code Pulang Terkunci'}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f8f8fd] text-[13px] font-mono font-semibold text-[#5d6367]">
                <Clock className="w-4 h-4" />
                <span>{todayData?.jam_pulang || '--:--'}</span>
              </div>
            </div>
            <LogOutIcon
              className={`w-6 h-6 shrink-0 ${
                todayData?.jam_pulang
                  ? 'text-[#135e3d]'
                  : todayData?.boleh_scan_pulang
                  ? 'text-[#0055ff]'
                  : 'text-[#b91c1c]'
              }`}
            />
          </div>

          {!todayData?.jam_pulang && (todayData?.alasan_pulang_terkunci || todayData?.kbm_selesai) && (
            <div className="text-[11px] leading-relaxed px-3 py-2 rounded-2xl bg-[#f8f8fd] border border-[#e3e1ec] text-[#5d6367]">
              {todayData?.alasan_pulang_terkunci ||
                `QR Code Pulang aktif setelah KBM berakhir pukul ${todayData?.kbm_selesai}.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
