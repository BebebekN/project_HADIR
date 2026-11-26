<?php

namespace App\Filament\Pages\Auth;

use Filament\Forms\Components\Component;
use Filament\Forms\Components\TextInput;
use Filament\Pages\Auth\Login as BaseLogin;
use Illuminate\Contracts\Support\Htmlable;

class Login extends BaseLogin
{
    public function getHeading(): string|Htmlable
    {
        return 'Masuk ke Panel HADIR';
    }

    public function getSubheading(): string|Htmlable|null
    {
        return 'Kelola Data Siswa XI PPLG 4, Jadwal, QR Harian & Rapor PKL (Demo: admin / admin123)';
    }

    protected function getForms(): array
    {
        return [
            'form' => $this->form(
                $this->makeForm()
                    ->schema([
                        $this->getNisNipFormComponent(),
                        $this->getPasswordFormComponent(),
                        $this->getRememberFormComponent(),
                    ])
                    ->statePath('data'),
            ),
        ];
    }

    protected function getNisNipFormComponent(): Component
    {
        return TextInput::make('nis_nip')
            ->label('NIS / NIP / Username Admin')
            ->placeholder('Masukkan username admin (contoh: admin)')
            ->required()
            ->autocomplete()
            ->autofocus()
            ->extraInputAttributes(['tabindex' => 1]);
    }

    protected function getCredentialsFromFormData(array $data): array
    {
        return [
            'nis_nip' => $data['nis_nip'],
            'password' => $data['password'],
        ];
    }
}
