@echo off
echo Memulai Frontend Web React (Vite) di port 5173...
set PATH=C:\laragon\bin\nodejs\node-v22;%PATH%
cd /d "%~dp0frontend-web"
npm.cmd run dev -- --host 127.0.0.1 --port 5173
