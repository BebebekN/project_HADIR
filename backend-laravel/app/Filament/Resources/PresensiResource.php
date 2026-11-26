<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PresensiResource\Pages;
use App\Models\Presensi;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PresensiResource extends Resource
{
    protected static ?string $model = Presensi::class;

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-check';

    protected static ?string $navigationLabel = 'Rekap Presensi';

    protected static ?string $modelLabel = 'Presensi';

    protected static ?string $pluralModelLabel = 'Rekap Presensi';

    protected static ?string $navigationGroup = 'Presensi & Disiplin';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('user_id')
                    ->label('Siswa')
                    ->relationship('user', 'nama_lengkap', fn ($query) => $query->where('role', 'siswa'))
                    ->searchable(['nama_lengkap', 'nis_nip'])
                    ->required(),
                Forms\Components\DatePicker::make('tanggal')
                    ->label('Tanggal')
                    ->default(now())
                    ->required(),
                Forms\Components\TimePicker::make('jam_datang')
                    ->label('Jam Datang')
                    ->seconds(false),
                Forms\Components\TimePicker::make('jam_pulang')
                    ->label('Jam Pulang')
                    ->seconds(false),
                Forms\Components\Select::make('status')
                    ->label('Status Kehadiran')
                    ->options([
                        'Tepat Waktu' => 'Tepat Waktu',
                        'Terlambat' => 'Terlambat',
                    ])
                    ->required(),
                Forms\Components\TextInput::make('poin_perubahan')
                    ->label('Perubahan Poin')
                    ->numeric()
                    ->default(0),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('tanggal')
                    ->label('Tanggal')
                    ->date('d M Y')
                    ->sortable(),
                Tables\Columns\TextColumn::make('user.nama_lengkap')
                    ->label('Nama Siswa')
                    ->description(fn (Presensi $record): string => "NIS: {$record->user?->nis_nip} | {$record->user?->kelas}")
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('user.kelas')
                    ->label('Kelas')
                    ->badge()
                    ->color('info')
                    ->sortable(),
                Tables\Columns\TextColumn::make('jam_datang')
                    ->label('Jam Datang')
                    ->time('H:i')
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('jam_pulang')
                    ->label('Jam Pulang')
                    ->time('H:i')
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'Tepat Waktu' => 'success',
                        'Terlambat' => 'danger',
                        default => 'secondary',
                    }),
                Tables\Columns\TextColumn::make('poin_perubahan')
                    ->label('Efek Poin')
                    ->badge()
                    ->color(fn (int $state): string => $state < 0 ? 'danger' : 'success')
                    ->formatStateUsing(fn (int $state): string => $state === 0 ? '0' : (string) $state),
            ])
            ->defaultSort('tanggal', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'Tepat Waktu' => 'Tepat Waktu',
                        'Terlambat' => 'Terlambat',
                    ]),
                Tables\Filters\Filter::make('tanggal')
                    ->form([
                        Forms\Components\DatePicker::make('tanggal_presensi')->default(now()),
                    ])
                    ->query(function ($query, array $data) {
                        return $query->when(
                            $data['tanggal_presensi'],
                            fn ($q, $date) => $q->whereDate('tanggal', $date)
                        );
                    }),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPresensis::route('/'),
            'create' => Pages\CreatePresensi::route('/create'),
            'edit' => Pages\EditPresensi::route('/{record}/edit'),
        ];
    }
}
