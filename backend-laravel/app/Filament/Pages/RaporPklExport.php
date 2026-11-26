<?php

namespace App\Filament\Pages;

use App\Models\Presensi;
use App\Models\User;
use Filament\Pages\Page;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RaporPklExport extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-document-chart-bar';

    protected static ?string $navigationLabel = 'Rapor Kedisiplinan PKL';

    protected static ?string $title = 'Rapor Kedisiplinan & Bintang PKL';

    protected static ?string $navigationGroup = 'Laporan & Rapor PKL';

    protected static string $view = 'filament.pages.rapor-pkl-export';

    public string $selectedKelas = 'XI PPLG 4';
    public array $kelasList = ['XI PPLG 4', 'XI PPLG 1', 'XI PPLG 2', 'XI PPLG 3', 'XII PPLG 1', 'XII PPLG 2'];

    public function getStudentsProperty(): Collection
    {
        return User::where('role', 'siswa')
            ->where('kelas', $this->selectedKelas)
            ->withCount([
                'presensis as hadir_tepat_waktu_count' => fn ($q) => $q->where('status', 'Tepat Waktu'),
                'presensis as hadir_terlambat_count' => fn ($q) => $q->where('status', 'Terlambat'),
            ])
            ->orderBy('nama_lengkap', 'asc')
            ->get()
            ->map(function ($student) {
                $bintang = (float) $student->bintang;
                $predikat = match (true) {
                    $bintang >= 5.0 => 'Sangat Baik (A)',
                    $bintang >= 4.0 => 'Baik (B)',
                    $bintang >= 3.0 => 'Cukup (C)',
                    default => 'Kurang / Pembinaan (D)',
                };

                $student->predikat = $predikat;
                return $student;
            });
    }

    public function exportCsv(): StreamedResponse
    {
        $kelas = $this->selectedKelas;
        $students = $this->students;

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"rapor_kedisiplinan_pkl_{$kelas}_" . date('Ymd') . '.csv"',
        ];

        return response()->stream(function () use ($students, $kelas) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM for Excel UTF-8

            fputcsv($handle, ['RAPOR KEDISIPLINAN SISWA PRAKTIK KERJA LAPANGAN (PKL)']);
            fputcsv($handle, ['Kelas: ' . $kelas]);
            fputcsv($handle, ['Tanggal Cetak: ' . date('d-m-Y H:i')]);
            fputcsv($handle, []);
            fputcsv($handle, ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Tepat Waktu', 'Terlambat', 'Poin Disiplin', 'Rating Bintang', 'Predikat']);

            $no = 1;
            foreach ($students as $s) {
                fputcsv($handle, [
                    $no++,
                    $s->nis_nip,
                    $s->nama_lengkap,
                    $s->kelas,
                    $s->hadir_tepat_waktu_count,
                    $s->hadir_terlambat_count,
                    $s->poin_kedisiplinan,
                    number_format($s->bintang, 1),
                    $s->predikat,
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
