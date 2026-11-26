@echo off
echo ===================================================================
echo   Menjalankan Sistem Project-PSAS (PostgreSQL + Laravel + React)
echo ===================================================================

echo [1/3] Menjalankan Server PostgreSQL di port 5432...
call "%~dp0start-pgsql.bat"

echo [2/3] Menjalankan Server Laravel Backend di port 8000...
start "Laravel Backend Server (Project-PSAS)" cmd /k "%~dp0start-backend.bat"

echo [3/3] Menjalankan Frontend React Vite di port 5173...
start "React Frontend Web (Project-PSAS)" cmd /k "%~dp0start-frontend.bat"

echo.
echo ===================================================================
echo   Sistem Berhasil Dijalankan!
echo   - Frontend Web (React) : http://localhost:5173
echo   - Filament Admin       : http://localhost:8000/admin
echo   - REST API V1          : http://localhost:8000/api/v1
echo ===================================================================
