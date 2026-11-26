<x-filament-panels::page>
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Filter and Action Bar (Hidden when printing) -->
        <div class="psas-card psas-no-print" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <label for="kelasSelect" style="font-size: 0.875rem; font-weight: 700;">
                    Pilih Kelas:
                </label>
                <select
                    id="kelasSelect"
                    wire:model.live="selectedKelas"
                    style="border-radius: 0.75rem; border: 1px solid #cbd5e1; padding: 0.45rem 0.9rem; font-size: 0.875rem; font-weight: 600; background: #ffffff; color: #0f172a;"
                >
                    @foreach($kelasList as $kelas)
                        <option value="{{ $kelas }}">{{ $kelas }}</option>
                    @endforeach
                </select>
            </div>

            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <x-filament::button
                    color="gray"
                    icon="heroicon-m-printer"
                    onclick="window.print()"
                >
                    Cetak Rapor
                </x-filament::button>
                <x-filament::button
                    color="primary"
                    icon="heroicon-m-arrow-down-tray"
                    wire:click="exportCsv"
                >
                    Download CSV
                </x-filament::button>
            </div>
        </div>

        <!-- Printable Rapor Document -->
        <div class="psas-card psas-print-doc" style="background: #ffffff; color: #0f172a; padding: 2.5rem;">
            <!-- Kop Dokumen Sekolah -->
            <div style="text-align: center; padding-bottom: 1.25rem; margin-bottom: 1.5rem; border-bottom: 2px solid #0f172a;">
                <h1 style="font-size: 1.25rem; font-weight: 800; letter-spacing: 0.03em; text-transform: uppercase;">SMK TELKOM PURWOKERTO • SISTEM HADIR &amp; EVALUASI PKL</h1>
                <h2 style="font-size: 0.95rem; font-weight: 700; text-transform: uppercase; color: #334155; margin-top: 0.2rem;">RAPOR PENILAIAN KEDISIPLINAN PRAKTIK KERJA LAPANGAN (PKL)</h2>
                <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #475569; display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap;">
                    <span>Kelas: <strong style="color: #0f172a;">{{ $selectedKelas }} (RPL)</strong></span>
                    <span>Tahun Pelajaran: <strong style="color: #0f172a;">2026/2027</strong></span>
                    <span>Tanggal Rekap: <strong style="color: #0f172a;">{{ date('d F Y') }}</strong></span>
                </div>
            </div>

            <!-- Table of Students -->
            <div style="overflow-x: auto;">
                <table style="width: 100%; text-align: left; font-size: 0.875rem; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8fafc; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; font-size: 0.75rem; font-weight: 700; color: #334155; text-transform: uppercase;">
                            <th style="padding: 0.75rem; text-align: center; width: 42px;">No</th>
                            <th style="padding: 0.75rem 1rem;">NIS</th>
                            <th style="padding: 0.75rem 1rem;">Nama Lengkap Siswa</th>
                            <th style="padding: 0.75rem; text-align: center;">Tepat Waktu</th>
                            <th style="padding: 0.75rem; text-align: center;">Terlambat</th>
                            <th style="padding: 0.75rem; text-align: center;">Poin Disiplin</th>
                            <th style="padding: 0.75rem; text-align: center;">Bintang PKL</th>
                            <th style="padding: 0.75rem 1rem; text-align: center;">Predikat</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($this->students as $index => $student)
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 0.75rem; text-align: center; color: #64748b;">{{ $index + 1 }}</td>
                                <td style="padding: 0.75rem 1rem; font-family: monospace; font-size: 0.8rem;">{{ $student->nis_nip }}</td>
                                <td style="padding: 0.75rem 1rem; font-weight: 600; color: #0f172a;">{{ $student->nama_lengkap }}</td>
                                <td style="padding: 0.75rem; text-align: center; font-weight: 700; color: #059669;">{{ $student->hadir_tepat_waktu_count }}x</td>
                                <td style="padding: 0.75rem; text-align: center; font-weight: 700; color: #e11d48;">{{ $student->hadir_terlambat_count }}x</td>
                                <td style="padding: 0.75rem; text-align: center; font-weight: 700;">
                                    <span style="display: inline-block; padding: 0.2rem 0.6rem; border-radius: 0.375rem; font-size: 0.75rem; background: {{ $student->poin_kedisiplinan >= 95 ? '#d1fae5' : ($student->poin_kedisiplinan >= 85 ? '#dbeafe' : '#fef3c7') }}; color: {{ $student->poin_kedisiplinan >= 95 ? '#065f46' : ($student->poin_kedisiplinan >= 85 ? '#1e40af' : '#92400e') }};">
                                        {{ $student->poin_kedisiplinan }}
                                    </span>
                                </td>
                                <td style="padding: 0.75rem; text-align: center; font-weight: 700; color: #d97706;">
                                    ★ {{ number_format($student->bintang, 1) }}
                                </td>
                                <td style="padding: 0.75rem 1rem; text-align: center; font-size: 0.8rem; font-weight: 600;">
                                    {{ $student->predikat }}
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="8" style="padding: 2rem; text-align: center; color: #94a3b8;">
                                    Belum ada data siswa untuk kelas {{ $selectedKelas }}.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <!-- Tanda Tangan Pembimbing & Kepala Sekolah -->
            <div style="margin-top: 3rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; text-align: center; font-size: 0.8rem; color: #334155; padding-top: 2rem; border-top: 1px solid #e2e8f0;">
                <div>
                    <p style="margin-bottom: 4rem;">Mengetahui,<br><strong>Konsentrasi Keahlian Rekayasa Perangkat Lunak</strong></p>
                    <p style="font-weight: 700; text-decoration: underline;">Tim Kurikulum RPL / PPLG</p>
                    <p style="color: #64748b;">SMK Telkom Purwokerto</p>
                </div>
                <div>
                    <p style="margin-bottom: 4rem;">Wali Kelas / Pembimbing PKL,<br><strong>Kelas {{ $selectedKelas }}</strong></p>
                    <p style="font-weight: 700; text-decoration: underline;">Firda Ayu Nirmala, S.Kom</p>
                    <p style="color: #64748b;">NIP. 198804122015032003</p>
                </div>
            </div>
        </div>
    </div>
</x-filament-panels::page>
