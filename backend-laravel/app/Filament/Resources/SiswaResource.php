<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SiswaResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Hash;

class SiswaResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-academic-cap';

    protected static ?string $navigationLabel = 'Data Siswa';

    protected static ?string $modelLabel = 'Siswa';

    protected static ?string $pluralModelLabel = 'Data Siswa';

    protected static ?string $navigationGroup = 'Manajemen Pengguna';

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('role', 'siswa');
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('nis_nip')
                    ->label('NIS')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(50),
                Forms\Components\TextInput::make('nama_lengkap')
                    ->label('Nama Lengkap')
                    ->required()
                    ->maxLength(150),
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
                Forms\Components\Hidden::make('role')
                    ->default('siswa'),
                Forms\Components\TextInput::make('password')
                    ->label('Password')
                    ->password()
                    ->dehydrateStateUsing(fn (?string $state): ?string => filled($state) ? Hash::make($state) : null)
                    ->dehydrated(fn (?string $state): bool => filled($state))
                    ->required(fn (string $context): bool => $context === 'create'),
                Forms\Components\TextInput::make('poin_kedisiplinan')
                    ->label('Poin Kedisiplinan')
                    ->numeric()
                    ->default(100),
                Forms\Components\TextInput::make('bintang')
                    ->label('Rating Bintang (Rapor PKL)')
                    ->numeric()
                    ->step(0.1)
                    ->default(5.0),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('nis_nip')
                    ->label('NIS')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('nama_lengkap')
                    ->label('Nama Lengkap')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('kelas')
                    ->badge()
                    ->color('info')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('poin_kedisiplinan')
                    ->label('Poin')
                    ->badge()
                    ->color(fn (int $state): string => match (true) {
                        $state >= 95 => 'success',
                        $state >= 85 => 'info',
                        $state >= 75 => 'warning',
                        default => 'danger',
                    })
                    ->sortable(),
                Tables\Columns\TextColumn::make('bintang')
                    ->label('Bintang PKL')
                    ->icon('heroicon-s-star')
                    ->color('warning')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('kelas')
                    ->options([
                        'XI PPLG 4' => 'XI PPLG 4',
                        'XI PPLG 1' => 'XI PPLG 1',
                        'XI PPLG 2' => 'XI PPLG 2',
                        'XI PPLG 3' => 'XI PPLG 3',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('reset_poin')
                    ->label('Reset 100 Poin')
                    ->icon('heroicon-o-arrow-path')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(fn (User $record) => $record->update([
                        'poin_kedisiplinan' => 100,
                        'bintang' => 5.0,
                    ])),
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
            'index' => Pages\ListSiswas::route('/'),
            'create' => Pages\CreateSiswa::route('/create'),
            'edit' => Pages\EditSiswa::route('/{record}/edit'),
        ];
    }
}
