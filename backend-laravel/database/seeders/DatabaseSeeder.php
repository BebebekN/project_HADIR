<?php

namespace Database\Seeders;

use App\Models\DailyQrToken;
use App\Models\Jadwal;
use App\Models\Presensi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Admin
        User::updateOrCreate(
            ['nis_nip' => 'admin'],
            [
                'nama_lengkap' => 'Administrator HADIR',
                'kelas' => null,
                'role' => 'admin',
                'password' => Hash::make('admin123'),
                'poin_kedisiplinan' => 100,
                'bintang' => 5.0,
            ]
        );

        // 2. Guru (Wali Kelas XI PPLG 4: Firda Ayu Nirmala, S.Kom + Guru Mapel)
        $gurus = [
            ['nis_nip' => '198804122015032003', 'nama_lengkap' => 'Firda Ayu Nirmala, S.Kom'],
            ['nis_nip' => '198501012010011001', 'nama_lengkap' => 'Fendi Riawan'],
            ['nis_nip' => '199003152014022002', 'nama_lengkap' => 'Imelda Alfiana Palupi Dewi'],
            ['nis_nip' => '199107202016042004', 'nama_lengkap' => 'Novi Lailatul Faizah'],
            ['nis_nip' => '198305102009022005', 'nama_lengkap' => 'Hj Siti Mufsohah Muhimmati'],
            ['nis_nip' => '198609182012011006', 'nama_lengkap' => 'Andhang Jaka'],
            ['nis_nip' => '199202142018011007', 'nama_lengkap' => 'Faizal Anggriawan'],
            ['nis_nip' => '198711052014031008', 'nama_lengkap' => 'Prasetyo Adi Wibowo'],
            ['nis_nip' => '198906222015022009', 'nama_lengkap' => 'Tutut Destria Eliana'],
            ['nis_nip' => '199308112019032010', 'nama_lengkap' => 'Anisa Rizqi Utami'],
            ['nis_nip' => '198412032010012011', 'nama_lengkap' => 'Nina Wijiati'],
            ['nis_nip' => '199001252016031012', 'nama_lengkap' => 'Reza Aditya Permana'],
            ['nis_nip' => '199104192017022013', 'nama_lengkap' => 'Shinta Pertiwi'],
            ['nis_nip' => '198908292015032014', 'nama_lengkap' => 'Agustiana Dwi Nurcahyani'],
            ['nis_nip' => '199210072018021015', 'nama_lengkap' => 'Okky Andrianss'],
        ];

        foreach ($gurus as $g) {
            User::updateOrCreate(
                ['nis_nip' => $g['nis_nip']],
                [
                    'nama_lengkap' => $g['nama_lengkap'],
                    'kelas' => null,
                    'role' => 'guru',
                    'password' => Hash::make('guru123'),
                    'poin_kedisiplinan' => 100,
                    'bintang' => 5.0,
                ]
            );
        }

        // 3. 29 Peserta Didik Resmi Kelas XI PPLG 4 - SMK Telkom Purwokerto (2026/2027)
        $siswas = [
            ['nis_nip' => '541251004', 'nama_lengkap' => 'Achmad Fanani'],
            ['nis_nip' => '541251013', 'nama_lengkap' => 'Afrin Shabria Eshal'],
            ['nis_nip' => '541251040', 'nama_lengkap' => 'Anabella Earline Andiwa'],
            ['nis_nip' => '541251041', 'nama_lengkap' => 'Ananda Yosi Marsania'],
            ['nis_nip' => '541251047', 'nama_lengkap' => 'Annisa Azalia Zain'],
            ['nis_nip' => '541251058', 'nama_lengkap' => 'Aufa Abdurrahman'],
            ['nis_nip' => '541251062', 'nama_lengkap' => 'Avila Savero Iman'],
            ['nis_nip' => '541251077', 'nama_lengkap' => 'Cresendo Assyabani Darmawan'],
            ['nis_nip' => '541251097', 'nama_lengkap' => 'Ezar Nirbana'],
            ['nis_nip' => '541251106', 'nama_lengkap' => 'Falah Rauf Alvaro Waradana'],
            ['nis_nip' => '541251107', 'nama_lengkap' => 'Faris Kaelan Akbar Nugroho'],
            ['nis_nip' => '541251108', 'nama_lengkap' => 'Fathan Athaya Dimyati'],
            ['nis_nip' => '541251126', 'nama_lengkap' => 'Griselda Felixia Santoso'],
            ['nis_nip' => '541251127', 'nama_lengkap' => 'Hafizh Aditya'],
            ['nis_nip' => '541251141', 'nama_lengkap' => "Huga Fayyadh Arfa'"],
            ['nis_nip' => '541251185', 'nama_lengkap' => 'Mohamad Irgi'],
            ['nis_nip' => '541251196', 'nama_lengkap' => 'Muhammad Ghazy Putra Fetrian'],
            ['nis_nip' => '541251197', 'nama_lengkap' => 'Muhammad Hanif Rendraka Utomo'],
            ['nis_nip' => '541251216', 'nama_lengkap' => 'Naufal Azka Ilhami'],
            ['nis_nip' => '541251217', 'nama_lengkap' => 'Naufal Mirza Nugraha'],
            ['nis_nip' => '541251240', 'nama_lengkap' => 'Radithya Agun Pratama'],
            ['nis_nip' => '541251248', 'nama_lengkap' => 'Rafasyah Javas Nararya'],
            ['nis_nip' => '541251250', 'nama_lengkap' => 'Raffael Reyndra Setiawan'],
            ['nis_nip' => '541251254', 'nama_lengkap' => 'Rafika Khoerunnisa'],
            ['nis_nip' => '541251276', 'nama_lengkap' => 'Sekar Ayu Wijaya Kusuma Wardani'],
            ['nis_nip' => '541251277', 'nama_lengkap' => 'Shaskia Ayu Aurellia'],
            ['nis_nip' => '541251286', 'nama_lengkap' => 'Tania Nurilia Adinda'],
            ['nis_nip' => '541251292', 'nama_lengkap' => 'Vadel Rasendriya Syakieb'],
            ['nis_nip' => '541251302', 'nama_lengkap' => 'Wishagf Ghaizka Liliant'],
        ];

        $officialNisList = array_column($siswas, 'nis_nip');
        User::where('role', 'siswa')
            ->whereNotIn('nis_nip', $officialNisList)
            ->delete();

        $seededStudents = [];
        foreach ($siswas as $s) {
            $isLateSample = $s['nis_nip'] === '541251254';
            $student = User::updateOrCreate(
                ['nis_nip' => $s['nis_nip']],
                [
                    'nama_lengkap' => $s['nama_lengkap'],
                    'kelas' => 'XI PPLG 4',
                    'role' => 'siswa',
                    'password' => Hash::make('siswa123'),
                    'poin_kedisiplinan' => $isLateSample ? 95 : 100,
                    'bintang' => 5.0,
                ]
            );
            $seededStudents[$s['nis_nip']] = $student;

            // Sinkronkan akun Orang Tua otomatis menggunakan Double NIS anak (<NIS><NIS>)
            $doubleNis = $student->nis_nip . $student->nis_nip;
            User::updateOrCreate(
                ['nis_nip' => $doubleNis],
                [
                    'nama_lengkap' => 'Orang Tua ' . $student->nama_lengkap,
                    'kelas' => $student->kelas,
                    'child_user_id' => $student->id,
                    'role' => 'orang_tua',
                    'password' => Hash::make($doubleNis),
                    'poin_kedisiplinan' => 100,
                    'bintang' => 5.0,
                ]
            );
        }

        // 4. Jadwal Pelajaran Resmi XI PPLG 4 (Senin s.d. Jumat - 64 Sesi)
        $jadwalData = [
            // 1. Senin
            ['hari' => 'Senin', 'nama_kegiatan' => 'Apel / Upacara', 'nama_guru' => 'Kesiswaan', 'jam_mulai' => '06:30:00', 'jam_selesai' => '07:45:00'],
            ['hari' => 'Senin', 'nama_kegiatan' => 'Istirahat', 'nama_guru' => '-', 'jam_mulai' => '07:45:00', 'jam_selesai' => '08:00:00'],
            ['hari' => 'Senin', 'nama_kegiatan' => 'Mapel Pilihan', 'nama_guru' => 'Firda Ayu Nirmala, S.Kom', 'jam_mulai' => '08:00:00', 'jam_selesai' => '11:40:00'],
            ['hari' => 'Senin', 'nama_kegiatan' => 'Basis Data', 'nama_guru' => 'Fendi Riawan', 'jam_mulai' => '11:40:00', 'jam_selesai' => '12:20:00'],
            ['hari' => 'Senin', 'nama_kegiatan' => 'Istirahat', 'nama_guru' => '-', 'jam_mulai' => '12:20:00', 'jam_selesai' => '13:20:00'],
            ['hari' => 'Senin', 'nama_kegiatan' => 'Basis Data', 'nama_guru' => 'Fendi Riawan', 'jam_mulai' => '13:20:00', 'jam_selesai' => '14:00:00'],
            ['hari' => 'Senin', 'nama_kegiatan' => 'Basis Data', 'nama_guru' => 'Fendi Riawan', 'jam_mulai' => '14:00:00', 'jam_selesai' => '14:40:00'],
            ['hari' => 'Senin', 'nama_kegiatan' => 'Basis Data', 'nama_guru' => 'Fendi Riawan', 'jam_mulai' => '14:40:00', 'jam_selesai' => '15:20:00'],
            ['hari' => 'Senin', 'nama_kegiatan' => '5R', 'nama_guru' => 'Tim 5R', 'jam_mulai' => '15:20:00', 'jam_selesai' => '16:00:00'],

            // 2. Selasa
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Tadarus', 'nama_guru' => 'Tim Keagamaan', 'jam_mulai' => '07:00:00', 'jam_selesai' => '07:10:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Pendidikan Agama Islam', 'nama_guru' => 'Hj Siti Mufsohah Muhimmati', 'jam_mulai' => '07:10:00', 'jam_selesai' => '07:50:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Pendidikan Agama Islam', 'nama_guru' => 'Hj Siti Mufsohah Muhimmati', 'jam_mulai' => '07:50:00', 'jam_selesai' => '08:30:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Istirahat', 'nama_guru' => '-', 'jam_mulai' => '08:30:00', 'jam_selesai' => '09:00:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Pendidikan Agama Islam', 'nama_guru' => 'Hj Siti Mufsohah Muhimmati', 'jam_mulai' => '09:00:00', 'jam_selesai' => '09:40:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Pemrograman Berbasis Teks', 'nama_guru' => 'Firda Ayu Nirmala, S.Kom', 'jam_mulai' => '09:40:00', 'jam_selesai' => '10:20:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Pemrograman Berbasis Teks', 'nama_guru' => 'Firda Ayu Nirmala, S.Kom', 'jam_mulai' => '10:20:00', 'jam_selesai' => '11:00:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Pemrograman Berbasis Teks', 'nama_guru' => 'Firda Ayu Nirmala, S.Kom', 'jam_mulai' => '11:00:00', 'jam_selesai' => '11:40:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Pemrograman Berbasis Teks', 'nama_guru' => 'Firda Ayu Nirmala, S.Kom', 'jam_mulai' => '11:40:00', 'jam_selesai' => '12:20:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Istirahat', 'nama_guru' => '-', 'jam_mulai' => '12:20:00', 'jam_selesai' => '13:20:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Dasar Dasar PPLG', 'nama_guru' => 'Novi Lailatul Faizah', 'jam_mulai' => '13:20:00', 'jam_selesai' => '14:00:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Dasar Dasar PPLG', 'nama_guru' => 'Novi Lailatul Faizah', 'jam_mulai' => '14:00:00', 'jam_selesai' => '14:40:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Dasar Dasar PPLG', 'nama_guru' => 'Novi Lailatul Faizah', 'jam_mulai' => '14:40:00', 'jam_selesai' => '15:20:00'],
            ['hari' => 'Selasa', 'nama_kegiatan' => 'Dasar Dasar PPLG', 'nama_guru' => 'Novi Lailatul Faizah', 'jam_mulai' => '15:20:00', 'jam_selesai' => '16:00:00'],

            // 3. Rabu
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Tadarus', 'nama_guru' => 'Tim Keagamaan', 'jam_mulai' => '07:00:00', 'jam_selesai' => '07:10:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Kokurikuler', 'nama_guru' => 'Tim Kokurikuler', 'jam_mulai' => '07:10:00', 'jam_selesai' => '07:50:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Istirahat', 'nama_guru' => '-', 'jam_mulai' => '07:50:00', 'jam_selesai' => '08:20:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Bahasa Jawa', 'nama_guru' => 'Andhang Jaka', 'jam_mulai' => '08:20:00', 'jam_selesai' => '09:00:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Bahasa Jawa', 'nama_guru' => 'Andhang Jaka', 'jam_mulai' => '09:00:00', 'jam_selesai' => '09:40:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Pendidikan Jasmani', 'nama_guru' => 'Faizal Anggriawan', 'jam_mulai' => '09:40:00', 'jam_selesai' => '10:20:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Pendidikan Jasmani', 'nama_guru' => 'Faizal Anggriawan', 'jam_mulai' => '10:20:00', 'jam_selesai' => '11:00:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Bahasa Indonesia', 'nama_guru' => 'Prasetyo Adi Wibowo', 'jam_mulai' => '11:00:00', 'jam_selesai' => '11:40:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Bahasa Indonesia', 'nama_guru' => 'Prasetyo Adi Wibowo', 'jam_mulai' => '11:40:00', 'jam_selesai' => '12:20:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Istirahat', 'nama_guru' => '-', 'jam_mulai' => '12:20:00', 'jam_selesai' => '13:20:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Bahasa Indonesia', 'nama_guru' => 'Prasetyo Adi Wibowo', 'jam_mulai' => '13:20:00', 'jam_selesai' => '14:00:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Kreativitas, Inovasi, dan Kewirausahaan', 'nama_guru' => 'Tutut Destria Eliana', 'jam_mulai' => '14:00:00', 'jam_selesai' => '14:40:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Kreativitas, Inovasi, dan Kewirausahaan', 'nama_guru' => 'Tutut Destria Eliana', 'jam_mulai' => '14:40:00', 'jam_selesai' => '15:20:00'],
            ['hari' => 'Rabu', 'nama_kegiatan' => 'Kreativitas, Inovasi, dan Kewirausahaan', 'nama_guru' => 'Tutut Destria Eliana', 'jam_mulai' => '15:20:00', 'jam_selesai' => '16:00:00'],

            // 4. Kamis
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Tadarus', 'nama_guru' => 'Tim Keagamaan', 'jam_mulai' => '07:00:00', 'jam_selesai' => '07:10:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Bimbingan Konseling', 'nama_guru' => 'Anisa Rizqi Utami', 'jam_mulai' => '07:10:00', 'jam_selesai' => '07:50:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Bimbingan Konseling', 'nama_guru' => 'Anisa Rizqi Utami', 'jam_mulai' => '07:50:00', 'jam_selesai' => '08:30:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Istirahat', 'nama_guru' => '-', 'jam_mulai' => '08:30:00', 'jam_selesai' => '09:00:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Sejarah', 'nama_guru' => 'Nina Wijiati', 'jam_mulai' => '09:00:00', 'jam_selesai' => '09:40:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Sejarah', 'nama_guru' => 'Nina Wijiati', 'jam_mulai' => '09:40:00', 'jam_selesai' => '10:20:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Kreativitas, Inovasi, dan Kewirausahaan', 'nama_guru' => 'Reza Aditya Permana', 'jam_mulai' => '10:20:00', 'jam_selesai' => '11:00:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Kreativitas, Inovasi, dan Kewirausahaan', 'nama_guru' => 'Reza Aditya Permana', 'jam_mulai' => '11:00:00', 'jam_selesai' => '11:40:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Pemrograman Berbasis Mobile', 'nama_guru' => 'Imelda Alfiana Palupi Dewi', 'jam_mulai' => '11:40:00', 'jam_selesai' => '12:20:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Istirahat', 'nama_guru' => '-', 'jam_mulai' => '12:20:00', 'jam_selesai' => '13:20:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Pemrograman Berbasis Mobile', 'nama_guru' => 'Imelda Alfiana Palupi Dewi', 'jam_mulai' => '13:20:00', 'jam_selesai' => '14:00:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Pemrograman Berbasis Mobile', 'nama_guru' => 'Imelda Alfiana Palupi Dewi', 'jam_mulai' => '14:00:00', 'jam_selesai' => '14:40:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Pemrograman Berbasis Mobile', 'nama_guru' => 'Imelda Alfiana Palupi Dewi', 'jam_mulai' => '14:40:00', 'jam_selesai' => '15:20:00'],
            ['hari' => 'Kamis', 'nama_kegiatan' => 'Ekskul Prestasi atau Ekskul Sentra', 'nama_guru' => 'Pembina Ekskul', 'jam_mulai' => '15:20:00', 'jam_selesai' => '16:00:00'],

            // 5. Jumat
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Tadarus', 'nama_guru' => 'Tim Keagamaan', 'jam_mulai' => '07:00:00', 'jam_selesai' => '07:10:00'],
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Kokurikuler', 'nama_guru' => 'Tim Kokurikuler', 'jam_mulai' => '07:10:00', 'jam_selesai' => '08:00:00'],
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Istirahat', 'nama_guru' => '-', 'jam_mulai' => '08:00:00', 'jam_selesai' => '08:10:00'],
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Pendidikan Pancasila', 'nama_guru' => 'Shinta Pertiwi', 'jam_mulai' => '08:10:00', 'jam_selesai' => '08:50:00'],
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Pendidikan Pancasila', 'nama_guru' => 'Shinta Pertiwi', 'jam_mulai' => '08:50:00', 'jam_selesai' => '09:30:00'],
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Matematika', 'nama_guru' => 'Agustiana Dwi Nurcahyani', 'jam_mulai' => '09:30:00', 'jam_selesai' => '10:10:00'],
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Matematika', 'nama_guru' => 'Agustiana Dwi Nurcahyani', 'jam_mulai' => '10:10:00', 'jam_selesai' => '10:50:00'],
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Matematika', 'nama_guru' => 'Agustiana Dwi Nurcahyani', 'jam_mulai' => '10:50:00', 'jam_selesai' => '11:30:00'],
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Istirahat', 'nama_guru' => '-', 'jam_mulai' => '11:30:00', 'jam_selesai' => '12:50:00'],
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Bahasa Inggris', 'nama_guru' => 'Okky Andrianss', 'jam_mulai' => '12:50:00', 'jam_selesai' => '13:30:00'],
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Bahasa Inggris', 'nama_guru' => 'Okky Andrianss', 'jam_mulai' => '13:30:00', 'jam_selesai' => '14:10:00'],
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Bahasa Inggris', 'nama_guru' => 'Okky Andrianss', 'jam_mulai' => '14:10:00', 'jam_selesai' => '14:50:00'],
            ['hari' => 'Jumat', 'nama_kegiatan' => 'Bahasa Inggris', 'nama_guru' => 'Okky Andrianss', 'jam_mulai' => '14:50:00', 'jam_selesai' => '15:30:00'],
        ];

        Jadwal::truncate();

        foreach ($jadwalData as $j) {
            Jadwal::create([
                'kelas' => 'XI PPLG 4',
                'hari' => $j['hari'],
                'nama_kegiatan' => $j['nama_kegiatan'],
                'nama_guru' => $j['nama_guru'],
                'jam_mulai' => $j['jam_mulai'],
                'jam_selesai' => $j['jam_selesai'],
            ]);
        }

        // 5. Daily QR Token resmi buatan Admin untuk hari ini (WIB) - hapus token demo lama
        $today = Carbon::now('Asia/Jakarta');
        DailyQrToken::where('token', 'PSAS-QR-DEMO-TODAY')->delete();
        DailyQrToken::firstOrCreate(
            ['tanggal' => $today->toDateString()],
            [
                'token' => 'HADIR-' . strtoupper(Str::random(10)),
                'jam_mulai' => '06:00:00',
                'jam_selesai' => '17:00:00',
            ]
        );

        // 6. Contoh Presensi riwayat hari sebelumnya
        $yesterday = $today->copy()->subDays(1)->toDateString();
        Presensi::firstOrCreate(
            ['user_id' => $seededStudents['541251041']->id, 'tanggal' => $yesterday],
            [
                'jam_datang' => '06:45:00',
                'jam_pulang' => '15:35:00',
                'status' => 'Tepat Waktu',
                'poin_perubahan' => 0,
            ]
        );

        Presensi::firstOrCreate(
            ['user_id' => $seededStudents['541251185']->id, 'tanggal' => $yesterday],
            [
                'jam_datang' => '06:50:00',
                'jam_pulang' => '15:35:00',
                'status' => 'Tepat Waktu',
                'poin_perubahan' => 0,
            ]
        );

        Presensi::firstOrCreate(
            ['user_id' => $seededStudents['541251254']->id, 'tanggal' => $yesterday],
            [
                'jam_datang' => '07:12:00',
                'jam_pulang' => '15:35:00',
                'status' => 'Terlambat',
                'poin_perubahan' => -5,
            ]
        );
    }
}
