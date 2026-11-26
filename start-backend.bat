@echo off
echo Memulai Server Laravel Backend (HADIR - Project-PSAS) di 0.0.0.0:8000 (Localhost + LAN Wi-Fi)...
cd /d "%~dp0backend-laravel\public"
"C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" -c "%~dp0backend-laravel\php.ini" -S 0.0.0.0:8000 -t "%~dp0backend-laravel\public" "%~dp0backend-laravel\vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php"
