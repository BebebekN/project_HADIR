<x-filament-panels::page>
    <div class="psas-grid">
        <!-- Main QR Display Card -->
        <div class="psas-card" style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 1rem; border-radius: 9999px; background: #ecfdf5; color: #047857; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 1rem; border: 1px solid #a7f3d0;">
                <span style="width: 8px; height: 8px; border-radius: 9999px; background: #10b981;"></span>
                Presensi QR Aktif Hari Ini
            </div>

            <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.25rem;">
                {{ $tanggal }}
            </h2>
            <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem;">
                Arahkan kamera aplikasi Kotlin Android atau browser Web ke layar QR ini untuk mencatat presensi.
            </p>

            <div class="psas-qr-frame">
                @if($qrSvg)
                    {!! $qrSvg !!}
                @else
                    <div style="width: 240px; height: 240px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8;">
                        <x-heroicon-o-qr-code style="width: 72px; height: 72px;" />
                        <span style="font-size: 0.75rem; margin-top: 0.5rem;">QR Code: {{ $qrToken }}</span>
                    </div>
                @endif
            </div>

            <div style="margin-top: 1.5rem;">
                <x-filament::button
                    wire:click="regenerateToken"
                    icon="heroicon-m-arrow-path"
                    color="primary"
                    size="lg"
                >
                    Generate QR Baru
                </x-filament::button>
            </div>
        </div>

        <!-- Info & Parameter Card -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div class="psas-card">
                <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <x-heroicon-o-information-circle style="width: 20px; height: 20px; color: #10b981;" />
                    Parameter Presensi
                </h3>

                <dl style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.65rem; border-bottom: 1px solid #e2e8f0;">
                        <dt style="color: #64748b;">Token String</dt>
                        <dd style="font-family: monospace; font-weight: 700; color: #059669; background: #ecfdf5; padding: 0.2rem 0.55rem; border-radius: 0.4rem;">{{ $qrToken }}</dd>
                    </div>
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
                        <dt style="color: #64748b;">Jam Selesai</dt>
                        <dd style="font-weight: 600;">{{ $jamSelesai }} WIB</dd>
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
                    Buka halaman ini dan tekan <strong>F11</strong> untuk tampilan layar penuh di lobi sekolah. Kode QR harian akan otomatis diperbarui setiap hari.
                </p>
            </div>
        </div>
    </div>
</x-filament-panels::page>
