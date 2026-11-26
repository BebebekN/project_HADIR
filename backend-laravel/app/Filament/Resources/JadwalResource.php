<?php

namespace App\Filament\Resources;

use App\Filament\Resources\JadwalResource\Pages;
use App\Models\Jadwal;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class JadwalResource extends Resource
{
    protected static ?string $model = Jadwal::class;

    protected static ?string $navigationIcon = 'heroicon-o-calendar-days';

    protected static ?string $navigationLabel = 'Jadwal Pelajaran';

    protected static ?string $modelLabel = 'Jadwal';

    protected static ?string $pluralModelLabel = 'Jadwal Pelajaran';

    protected static ?string $navigationGroup = 'Akademik & Kegiatan';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('kelas')
                    ->label('Kelas')
                    ->options([
                        'XI PPLG 4' => 'XI PPLG 4',
                        'XI PPLG 1' => 'XI PPLG 1',
                        'XI PPLG 2' => 'XI PPLG 2',
                        'XI PPLG 3' => 'XI PPLG 3',
                        'XII PPLG 1' => 'XII PPLG 1',
                        'XII PPLG 2' => 'XII PPLG 2',
                    ])
                    ->default('XI PPLG 4')
                    ->required(),
                Forms\Components\Select::make('hari')
                    ->label('Hari')
                    ->options([
                        'Senin' => 'Senin',
                        'Selasa' => 'Selasa',
                        'Rabu' => 'Rabu',
                        'Kamis' => 'Kamis',
                        'Jumat' => 'Jumat',
                    ])
                    ->required(),
                Forms\Components\TextInput::make('nama_kegiatan')
                    ->label('Nama Mata Pelajaran / Kegiatan')
                    ->required()
                    ->maxLength(150),
                Forms\Components\TextInput::make('nama_guru')
                    ->label('Nama Guru Pengajar')
                    ->required()
                    ->maxLength(150),
                Forms\Components\TimePicker::make('jam_mulai')
                    ->label('Jam Mulai')
                    ->seconds(false)
                    ->required(),
                Forms\Components\TimePicker::make('jam_selesai')
                    ->label('Jam Selesai')
                    ->seconds(false)
                    ->required(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('kelas')
                    ->badge()
                    ->color('info')
                    ->sortable()
                    ->searchable(),
                Tables\Columns\TextColumn::make('hari')
                    ->badge()
                    ->color('primary')
                    ->sortable()
                    ->searchable(),
                Tables\Columns\TextColumn::make('nama_kegiatan')
                    ->label('Mata Pelajaran')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('nama_guru')
                    ->label('Guru')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('jam_mulai')
                    ->label('Mulai')
                    ->time('H:i')
                    ->sortable(),
                Tables\Columns\TextColumn::make('jam_selesai')
                    ->label('Selesai')
                    ->time('H:i')
                    ->sortable(),
            ])
            ->defaultSort('jam_mulai', 'asc')
            ->filters([
                Tables\Filters\SelectFilter::make('kelas')
                    ->options([
                        'XI PPLG 4' => 'XI PPLG 4',
                        'XI PPLG 1' => 'XI PPLG 1',
                        'XI PPLG 2' => 'XI PPLG 2',
                        'XI PPLG 3' => 'XI PPLG 3',
                    ]),
                Tables\Filters\SelectFilter::make('hari')
                    ->options([
                        'Senin' => 'Senin',
                        'Selasa' => 'Selasa',
                        'Rabu' => 'Rabu',
                        'Kamis' => 'Kamis',
                        'Jumat' => 'Jumat',
                    ]),
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
            'index' => Pages\ListJadwals::route('/'),
            'create' => Pages\CreateJadwal::route('/create'),
            'edit' => Pages\EditJadwal::route('/{record}/edit'),
        ];
    }
}
