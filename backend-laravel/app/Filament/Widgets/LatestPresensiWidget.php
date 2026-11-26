<?php

namespace App\Filament\Widgets;

use App\Models\Presensi;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class LatestPresensiWidget extends BaseWidget
{
    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 'full';

    protected static ?string $heading = 'Aktivitas Scan Presensi Terbaru';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Presensi::query()->with('user')->latest('updated_at')->limit(8)
            )
            ->columns([
                Tables\Columns\TextColumn::make('tanggal')
                    ->label('Tanggal')
                    ->date('d M Y'),
                Tables\Columns\TextColumn::make('user.nama_lengkap')
                    ->label('Nama Siswa')
                    ->description(fn (Presensi $record): string => "NIS: {$record->user?->nis_nip}"),
                Tables\Columns\TextColumn::make('user.kelas')
                    ->label('Kelas')
                    ->badge()
                    ->color('info'),
                Tables\Columns\TextColumn::make('jam_datang')
                    ->label('Jam Datang')
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('jam_pulang')
                    ->label('Jam Pulang')
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'Tepat Waktu' => 'success',
                        'Terlambat' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('poin_perubahan')
                    ->label('Efek Poin')
                    ->badge()
                    ->color(fn (int $state): string => $state < 0 ? 'danger' : 'success'),
            ])
            ->paginated(false);
    }
}
