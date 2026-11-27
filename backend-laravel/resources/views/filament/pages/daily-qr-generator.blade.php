<x-filament-panels::page>
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Header Card & Regenerate -->
        <div class="psas-card" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
            <div>
                <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 1rem; border-radius: 9999px; background: #ecfdf5; color: #047857; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.6rem; border: 1px solid #a7f3d0;">
                    <span style="width: 8px; height: 8px; border-radius: 9999px; background: #10b981;"></span>
                    Pasangan QR Presensi Aktif Hari Ini
                </div>
                <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 0.25rem;">
                    {{ $tanggal }}
                </h2>
                <p style="font-size: 0.875rem; color: #64748b;">
                    Admin membuat 2 kode QR berpasangan: <strong>QR Datang</strong> dan <strong>QR Pulang</strong>. QR Pulang hanya dapat digunakan setelah siswa scan QR Datang dan kegiatan KBM hari ini berakhir pukul <strong>{{ $kbmSelesai }} WIB</strong>.
                </p>
            </div>

            <div>
                <x-filament::button
                    wire:click="regenerateToken"
                    icon="heroicon-m-arrow-path"
                    color="primary"
                    size="lg"
                >
                    Generate Pasangan QR Baru
                </x-filament::button>
            </div>
        </div>

        <!-- Paired QR Cards (Datang & Pulang) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1.5rem;">
            <!-- QR Code Datang -->
            <div class="psas-card" style="display: flex; flex-direction: column; align-items: center; text-align: center; border-top: 4px solid #059669;">
                <div style="display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.3rem 0.9rem; border-radius: 9999px; background: #ecfdf5; color: #047857; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.85rem; border: 1px solid #a7f3d0;">
                    1. QR Code Datang (Masuk)
                </div>

                <h3 style="font-size: 1.125rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem;">
                    Presensi Kedatangan Siswa
                </h3>
                <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1.25rem;">
                    Dibuka mulai {{ $jamMulai }} WIB • Tepat waktu &le; 07:00 WIB
                </p>

                <div class="psas-qr-frame" style="background: #ffffff; padding: 1rem; border-radius: 1rem; border: 2px solid #d1fae5; max-width: 280px; width: 100%;">
                    @if($qrSvgDatang)
                        {!! $qrSvgDatang !!}
                    @else
                        <div style="width: 220px; height: 220px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8;">
                            <x-heroicon-o-qr-code style="width: 64px; height: 64px;" />
                            <span style="font-size: 0.75rem; margin-top: 0.5rem;">{{ $tokenDatang }}</span>
                        </div>
                    @endif
                </div>

                <div style="margin-top: 1rem; width: 100%; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 0.75rem; padding: 0.65rem 1rem;">
                    <span style="display: block; font-size: 0.7rem; font-weight: 700; color: #047857; text-transform: uppercase;">Token QR Datang</span>
                    <span style="font-family: monospace; font-size: 1rem; font-weight: 800; color: #065f46; letter-spacing: 0.04em;">{{ $tokenDatang }}</span>
                </div>
            </div>

            <!-- QR Code Pulang -->
            <div class="psas-card" style="display: flex; flex-direction: column; align-items: center; text-align: center; border-top: 4px solid #1d4ed8;">
                <div style="display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.3rem 0.9rem; border-radius: 9999px; background: #eff6ff; color: #1d4ed8; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.85rem; border: 1px solid #bfdbfe;">
                    2. QR Code Pulang (Kepulangan)
                </div>

                <h3 style="font-size: 1.125rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem;">
                    Presensi Kepulangan Siswa
                </h3>
                <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1.25rem;">
                    Aktif setelah scan QR Datang & KBM selesai (&ge; {{ $kbmSelesai }} WIB)
                </p>

                <div class="psas-qr-frame" style="background: #ffffff; padding: 1rem; border-radius: 1rem; border: 2px solid #dbeafe; max-width: 280px; width: 100%;">
                    @if($qrSvgPulang)
                        {!! $qrSvgPulang !!}
                    @else
                        <div style="width: 220px; height: 220px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8;">
                            <x-heroicon-o-qr-code style="width: 64px; height: 64px;" />
                            <span style="font-size: 0.75rem; margin-top: 0.5rem;">{{ $tokenPulang }}</span>
                        </div>
                    @endif
                </div>

                <div style="margin-top: 1rem; width: 100%; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.75rem; padding: 0.65rem 1rem;">
                    <span style="display: block; font-size: 0.7rem; font-weight: 700; color: #1d4ed8; text-transform: uppercase;">Token QR Pulang</span>
                    <span style="font-family: monospace; font-size: 1rem; font-weight: 800; color: #1e3a8a; letter-spacing: 0.04em;">{{ $tokenPulang }}</span>
                </div>
            </div>
        </div>

        <!-- Info & Parameter Card -->
        <div class="psas-grid">
            <div class="psas-card">
                <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <x-heroicon-o-information-circle style="width: 20px; height: 20px; color: #10b981;" />
                    Parameter Presensi Berpasangan
                </h3>

                <dl style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.65rem; border-bottom: 1px solid #e2e8f0;">
                        <dt style="color: #64748b;">Jam Mulai Scan</dt>
                        <dd style="font-weight: 600;">{{ $jamMulai }} WIB</dd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.65rem; border-bottom: 1px solid #e2e8f0;">
                        <dt style="color: #64748b;">Batas Tepat Waktu</dt>
                        <dd style="font-weight: 800; color: #059669;">07:00 WIB</dd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.65rem; border-bottom: 1px solid #e2e8f0;">
                        <dt style="color: #64748b;">Status Terlambat</dt>
                        <dd style="font-weight: 600; color: #d97706;">&gt; 07:00 WIB (-5 Poin)</dd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.65rem; border-bottom: 1px solid #e2e8f0;">
                        <dt style="color: #64748b;">Selesai KBM Hari Ini (Buka QR Pulang)</dt>
                        <dd style="font-weight: 800; color: #1d4ed8;">{{ $kbmSelesai }} WIB</dd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.65rem; border-bottom: 1px solid #e2e8f0;">
                        <dt style="color: #64748b;">Kawasan Sekolah</dt>
                        <dd style="font-weight: 700; color: #122B51;">{{ config('hadir.school.name') }}</dd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <dt style="color: #64748b;">Radius Geofence</dt>
                        <dd style="font-family: monospace; font-weight: 700; color: #009B90;">Maks {{ (int) config('hadir.school.radius_meters') }} m</dd>
                    </div>
                </dl>
            </div>

            <div class="psas-tip-card">
                <h4 style="font-weight: 700; font-size: 1rem; margin-bottom: 0.5rem;">Tips Proyektor Layar Sekolah</h4>
                <p style="font-size: 0.8rem; line-height: 1.5; color: #ecfdf5;">
                    Tampilkan kedua QR Code ini di lobi sekolah. Siswa scan <strong>QR Code Datang</strong> saat tiba di sekolah, lalu baru bisa melakukan scan <strong>QR Code Pulang</strong> setelah jam KBM selesai ({{ $kbmSelesai }} WIB).
                </p>
            </div>
        </div>
    </div>
</x-filament-panels::page>
